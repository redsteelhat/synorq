-- Workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  created_at timestamptz default now()
);

-- AI Tools (workspace'e bağlı, şifreli API key)
create table ai_tools (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,           -- 'openai' | 'anthropic' | 'google'
  display_name text not null,   -- 'ChatGPT' | 'Claude' | 'Gemini'
  api_key_encrypted text,
  model text,                   -- 'gpt-4o' | 'claude-3-5-sonnet' | 'gemini-1.5-pro'
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Prompts
create table prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  content text not null,
  version integer default 1,
  parent_id uuid references prompts(id),  -- versiyon zinciri
  tags text[],
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  tool_id uuid references ai_tools(id),
  prompt_id uuid references prompts(id),
  custom_prompt text,           -- prompt seçilmezse serbest metin
  status text default 'pending', -- 'pending' | 'running' | 'done' | 'failed'
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Outputs (görev çıktıları + loglama)
create table outputs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  content text,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cost_usd numeric(10, 6) default 0,
  model_used text,
  duration_ms integer,
  error text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table workspaces enable row level security;
alter table ai_tools enable row level security;
alter table prompts enable row level security;
alter table tasks enable row level security;
alter table outputs enable row level security;

create policy "workspace_owner" on workspaces
  for all using (owner_id = auth.uid());

create policy "workspace_member_tools" on ai_tools
  for all using (workspace_id in (
    select id from workspaces where owner_id = auth.uid()
  ));

create policy "workspace_member_prompts" on prompts
  for all using (workspace_id in (
    select id from workspaces where owner_id = auth.uid()
  ));

create policy "workspace_member_tasks" on tasks
  for all using (workspace_id in (
    select id from workspaces where owner_id = auth.uid()
  ));

create policy "workspace_member_outputs" on outputs
  for all using (workspace_id in (
    select id from workspaces where owner_id = auth.uid()
  ));
