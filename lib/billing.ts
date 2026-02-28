import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkspacePlan = 'free' | 'starter' | 'agency';
export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

type ScopeType = 'workspace' | 'tool' | 'tag';

interface PlanLimits {
  requestsPerMonth: number | null;
  tokensPerMonth: number | null;
  costUsdPerMonth: number | null;
}

interface BudgetRow {
  id: string;
  scope_type: ScopeType;
  scope_id: string | null;
  monthly_limit_usd: number | string;
}

interface OutputUsageRow {
  cost_usd: number | string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  client_tag: string | null;
  project_tag: string | null;
  tasks?: { tool_id?: string | null } | { tool_id?: string | null }[] | null;
}

export interface UsageSnapshot {
  requestsUsed: number;
  tokensUsed: number;
  costUsdUsed: number;
}

export interface UsageWarning {
  metric: 'requests' | 'tokens' | 'cost_usd';
  used: number;
  limit: number;
  ratio: number;
  message: string;
}

export interface RunGuardResult {
  allowed: boolean;
  status: number;
  code: 'OK' | 'LIMIT_SOFT_WARNING' | 'LIMIT_EXCEEDED' | 'BUDGET_EXCEEDED';
  message: string;
  warnings: UsageWarning[];
  usage: UsageSnapshot;
  plan: WorkspacePlan;
  effectivePlan: WorkspacePlan;
  upgradeCtaUrl: string;
}

export interface WorkspaceBillingContext {
  id: string;
  plan: WorkspacePlan;
  subscription_status: SubscriptionStatus;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  free: {
    requestsPerMonth: 100,
    tokensPerMonth: 200_000,
    costUsdPerMonth: 5,
  },
  starter: {
    requestsPerMonth: 5_000,
    tokensPerMonth: 10_000_000,
    costUsdPerMonth: 200,
  },
  agency: {
    // Configurable by design, no hard cap by default.
    requestsPerMonth: null,
    tokensPerMonth: null,
    costUsdPerMonth: null,
  },
};

const ACTIVE_STATUSES = new Set<SubscriptionStatus>(['active', 'trialing']);

export function getEffectivePlan(plan: WorkspacePlan, status: SubscriptionStatus): WorkspacePlan {
  if (plan === 'free') return 'free';
  return ACTIVE_STATUSES.has(status) ? plan : 'free';
}

export function getStripePriceIdForPlan(plan: Exclude<WorkspacePlan, 'free'>): string | null {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null;
  if (plan === 'agency') return process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? null;
  return null;
}

export function planFromStripePriceId(priceId?: string | null): WorkspacePlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_AGENCY_MONTHLY) return 'agency';
  return null;
}

export function currentMonthStartIso(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function normalizeToolId(row: OutputUsageRow): string | null {
  const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
  return task?.tool_id ?? null;
}

function toNumber(value: number | string | null | undefined): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function summarizeUsage(rows: OutputUsageRow[]) {
  const byTool = new Map<string, number>();
  const byTag = new Map<string, number>();

  let requestsUsed = 0;
  let tokensUsed = 0;
  let costUsdUsed = 0;

  for (const row of rows) {
    const rowCost = toNumber(row.cost_usd);
    const rowTokens = toNumber(row.input_tokens) + toNumber(row.output_tokens);

    requestsUsed += 1;
    tokensUsed += rowTokens;
    costUsdUsed += rowCost;

    const toolId = normalizeToolId(row);
    if (toolId) byTool.set(toolId, (byTool.get(toolId) ?? 0) + rowCost);

    if (row.client_tag) {
      byTag.set(`client:${row.client_tag}`, (byTag.get(`client:${row.client_tag}`) ?? 0) + rowCost);
      byTag.set(row.client_tag, (byTag.get(row.client_tag) ?? 0) + rowCost);
    }

    if (row.project_tag) {
      byTag.set(`project:${row.project_tag}`, (byTag.get(`project:${row.project_tag}`) ?? 0) + rowCost);
      byTag.set(row.project_tag, (byTag.get(row.project_tag) ?? 0) + rowCost);
    }
  }

  return {
    usage: {
      requestsUsed,
      tokensUsed,
      costUsdUsed,
    },
    byTool,
    byTag,
  };
}

async function fetchMonthlyUsageRows(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<OutputUsageRow[]> {
  const { data, error } = await supabase
    .from('outputs')
    .select('cost_usd, input_tokens, output_tokens, client_tag, project_tag, tasks(tool_id)')
    .eq('workspace_id', workspaceId)
    .gte('created_at', currentMonthStartIso());

  if (error) throw error;
  return (data ?? []) as OutputUsageRow[];
}

async function fetchBudgets(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('id, scope_type, scope_id, monthly_limit_usd')
    .eq('workspace_id', workspaceId);

  if (error) {
    // Migration not applied yet or table missing in local env.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[billing] budgets query failed, skipping budget checks:', error.message);
    }
    return [];
  }

  return (data ?? []) as BudgetRow[];
}

function evaluatePlanThresholds(
  effectivePlan: WorkspacePlan,
  usage: UsageSnapshot
): { warnings: UsageWarning[]; hardReasons: string[] } {
  const limits = PLAN_LIMITS[effectivePlan];
  const warnings: UsageWarning[] = [];
  const hardReasons: string[] = [];

  const metrics: Array<{
    key: UsageWarning['metric'];
    used: number;
    limit: number | null;
    label: string;
  }> = [
    { key: 'requests', used: usage.requestsUsed, limit: limits.requestsPerMonth, label: 'Aylık istek limiti' },
    { key: 'tokens', used: usage.tokensUsed, limit: limits.tokensPerMonth, label: 'Aylık token limiti' },
    { key: 'cost_usd', used: usage.costUsdUsed, limit: limits.costUsdPerMonth, label: 'Aylık maliyet limiti' },
  ];

  for (const metric of metrics) {
    if (metric.limit === null) continue;
    if (metric.limit <= 0) continue;

    const ratio = metric.used / metric.limit;

    if (ratio >= 1) {
      hardReasons.push(`${metric.label} aşıldı (${metric.used}/${metric.limit}).`);
      continue;
    }

    if (ratio >= 0.8) {
      warnings.push({
        metric: metric.key,
        used: metric.used,
        limit: metric.limit,
        ratio,
        message: `${metric.label} %${Math.round(ratio * 100)} seviyesinde.`,
      });
    }
  }

  return { warnings, hardReasons };
}

function evaluateBudgets(
  budgets: BudgetRow[],
  usage: UsageSnapshot,
  byTool: Map<string, number>,
  byTag: Map<string, number>,
  toolId: string | null,
  clientTag: string | null,
  projectTag: string | null
): string[] {
  if (!budgets.length) return [];

  const reasons: string[] = [];
  const relevantTagKeys = new Set<string>();
  if (clientTag) {
    relevantTagKeys.add(clientTag);
    relevantTagKeys.add(`client:${clientTag}`);
  }
  if (projectTag) {
    relevantTagKeys.add(projectTag);
    relevantTagKeys.add(`project:${projectTag}`);
  }

  for (const budget of budgets) {
    const limit = toNumber(budget.monthly_limit_usd);
    if (limit <= 0) continue;

    let spent = 0;
    let label = 'Bütçe';

    if (budget.scope_type === 'workspace') {
      spent = usage.costUsdUsed;
      label = 'Workspace bütçesi';
    } else if (budget.scope_type === 'tool') {
      if (!toolId || budget.scope_id !== toolId) continue;
      spent = byTool.get(toolId) ?? 0;
      label = 'Araç bütçesi';
    } else if (budget.scope_type === 'tag') {
      if (!budget.scope_id || !relevantTagKeys.has(budget.scope_id)) continue;
      spent = byTag.get(budget.scope_id) ?? 0;
      label = 'Tag bütçesi';
    }

    if (spent >= limit) {
      reasons.push(`${label} aşıldı (${spent.toFixed(4)}/${limit.toFixed(4)} USD).`);
    }
  }

  return reasons;
}

export async function logUsageGuardEvent(
  supabase: SupabaseClient,
  payload: {
    workspaceId: string;
    taskId?: string | null;
    toolId?: string | null;
    eventType: 'blocked' | 'soft_warning';
    reason: string;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from('usage_guard_logs').insert({
    workspace_id: payload.workspaceId,
    task_id: payload.taskId ?? null,
    tool_id: payload.toolId ?? null,
    event_type: payload.eventType,
    reason: payload.reason,
    metadata: payload.metadata ?? {},
  });

  if (error && process.env.NODE_ENV !== 'production') {
    console.warn('[billing] usage guard log insert failed:', error.message);
  }
}

export function triggerSoftLimitEmailPlaceholder(params: {
  workspaceId: string;
  warnings: UsageWarning[];
}) {
  if (!params.warnings.length) return;
  // Placeholder hook for email integration.
  console.info('[billing-email-placeholder] usage soft warning', {
    workspaceId: params.workspaceId,
    warnings: params.warnings,
  });
}

export async function evaluateRunGuard(params: {
  supabase: SupabaseClient;
  workspace: WorkspaceBillingContext;
  taskId: string;
  toolId: string | null;
  clientTag: string | null;
  projectTag: string | null;
}): Promise<RunGuardResult> {
  const { supabase, workspace, taskId, toolId, clientTag, projectTag } = params;

  const monthlyRows = await fetchMonthlyUsageRows(supabase, workspace.id);
  const { usage, byTool, byTag } = summarizeUsage(monthlyRows);

  const effectivePlan = getEffectivePlan(workspace.plan, workspace.subscription_status);
  const { warnings, hardReasons } = evaluatePlanThresholds(effectivePlan, usage);

  const budgets = await fetchBudgets(supabase, workspace.id);
  const budgetReasons = evaluateBudgets(
    budgets,
    usage,
    byTool,
    byTag,
    toolId,
    clientTag,
    projectTag
  );

  const isBudgetBlocked = budgetReasons.length > 0;
  const isPlanBlocked = hardReasons.length > 0;

  if (isPlanBlocked || isBudgetBlocked) {
    const code: RunGuardResult['code'] = isBudgetBlocked ? 'BUDGET_EXCEEDED' : 'LIMIT_EXCEEDED';
    const reasons = [...hardReasons, ...budgetReasons].join(' ');
    const message =
      code === 'BUDGET_EXCEEDED'
        ? `Bütçe sınırı aşıldı. ${reasons}`
        : `Plan kullanım sınırı aşıldı. ${reasons}`;

    await logUsageGuardEvent(supabase, {
      workspaceId: workspace.id,
      taskId,
      toolId,
      eventType: 'blocked',
      reason: message,
      metadata: {
        usage,
        plan: workspace.plan,
        effectivePlan,
      },
    });

    return {
      allowed: false,
      status: 402,
      code,
      message,
      warnings,
      usage,
      plan: workspace.plan,
      effectivePlan,
      upgradeCtaUrl: '/dashboard?upgrade=1',
    };
  }

  if (warnings.length) {
    triggerSoftLimitEmailPlaceholder({
      workspaceId: workspace.id,
      warnings,
    });

    await logUsageGuardEvent(supabase, {
      workspaceId: workspace.id,
      taskId,
      toolId,
      eventType: 'soft_warning',
      reason: warnings.map((warning) => warning.message).join(' | '),
      metadata: {
        usage,
        plan: workspace.plan,
        effectivePlan,
      },
    });
  }

    return {
      allowed: true,
      status: 200,
      code: warnings.length ? 'LIMIT_SOFT_WARNING' : 'OK',
      message: warnings.length ? 'Soft limit warning' : 'Usage within limits',
      warnings,
      usage,
    plan: workspace.plan,
    effectivePlan,
    upgradeCtaUrl: '/dashboard?upgrade=1',
  };
}

export async function getWorkspaceUsageStatus(params: {
  supabase: SupabaseClient;
  workspace: WorkspaceBillingContext;
}) {
  const rows = await fetchMonthlyUsageRows(params.supabase, params.workspace.id);
  const { usage } = summarizeUsage(rows);
  const effectivePlan = getEffectivePlan(params.workspace.plan, params.workspace.subscription_status);
  const { warnings, hardReasons } = evaluatePlanThresholds(effectivePlan, usage);

  return {
    usage,
    warnings,
    hardReasons,
    plan: params.workspace.plan,
    effectivePlan,
    limits: PLAN_LIMITS[effectivePlan],
  };
}
