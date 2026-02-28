-- Billing + Usage Control Layer

-- Workspace subscription state
alter table if exists workspaces
  add column if not exists subscription_status text default 'inactive';

update workspaces
set subscription_status = 'inactive'
where subscription_status is null;

alter table if exists workspaces
  alter column subscription_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_plan_check'
  ) then
    alter table workspaces
      add constraint workspaces_plan_check
      check (plan in ('free', 'starter', 'agency'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_subscription_status_check'
  ) then
    alter table workspaces
      add constraint workspaces_subscription_status_check
      check (
        subscription_status in (
          'inactive',
          'trialing',
          'active',
          'past_due',
          'unpaid',
          'canceled',
          'incomplete',
          'incomplete_expired'
        )
      );
  end if;
end $$;

-- Budget engine
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  scope_type text not null check (scope_type in ('workspace', 'tool', 'tag')),
  scope_id text,
  monthly_limit_usd numeric(12, 4) not null check (monthly_limit_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_budgets_workspace on budgets(workspace_id);
create index if not exists idx_budgets_scope on budgets(workspace_id, scope_type, scope_id);

alter table budgets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'budgets'
      and policyname = 'workspace_member_budgets'
  ) then
    create policy "workspace_member_budgets" on budgets
      for all
      using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
      with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));
  end if;
end $$;

-- Tagging for agency workflows
alter table if exists tasks
  add column if not exists client_tag text,
  add column if not exists project_tag text;

alter table if exists outputs
  add column if not exists client_tag text,
  add column if not exists project_tag text;

create index if not exists idx_tasks_client_tag on tasks(client_tag);
create index if not exists idx_tasks_project_tag on tasks(project_tag);
create index if not exists idx_outputs_client_tag on outputs(client_tag);
create index if not exists idx_outputs_project_tag on outputs(project_tag);
create index if not exists idx_outputs_workspace_created_at on outputs(workspace_id, created_at);

-- Stripe webhook idempotency table
create table if not exists stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb
);

-- Rejection + soft warning logs for limit/budget engine
create table if not exists usage_guard_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  tool_id uuid references ai_tools(id) on delete set null,
  event_type text not null default 'blocked' check (event_type in ('blocked', 'soft_warning')),
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_guard_logs_workspace_created_at on usage_guard_logs(workspace_id, created_at desc);

alter table usage_guard_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_guard_logs'
      and policyname = 'workspace_member_usage_guard_logs'
  ) then
    create policy "workspace_member_usage_guard_logs" on usage_guard_logs
      for all
      using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
      with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));
  end if;
end $$;

