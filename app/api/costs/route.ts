import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type OutputJoinRow = {
  created_at: string;
  cost_usd: number | string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  duration_ms: number | null;
  client_tag: string | null;
  project_tag: string | null;
  tasks?:
    | {
        tool_id?: string | null;
        ai_tools?: { display_name?: string } | { display_name?: string }[] | null;
      }
    | {
        tool_id?: string | null;
        ai_tools?: { display_name?: string } | { display_name?: string }[] | null;
      }[]
    | null;
};

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const days = Math.max(1, Math.min(60, Number(searchParams.get('days') ?? 14)));

    let workspaceQuery = supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (workspaceId) {
      workspaceQuery = workspaceQuery.eq('id', workspaceId);
    }

    const { data: workspace, error: workspaceError } = await workspaceQuery.single();
    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 404 });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (days - 1));
    dayStart.setHours(0, 0, 0, 0);

    const { data: rows, error } = await supabase
      .from('outputs')
      .select(
        'created_at, cost_usd, input_tokens, output_tokens, duration_ms, client_tag, project_tag, tasks(tool_id, ai_tools(display_name))'
      )
      .eq('workspace_id', workspace.id)
      .gte('created_at', monthStart.toISOString());

    if (error) throw error;

    const outputs = (rows ?? []) as OutputJoinRow[];

    const byTool = new Map<string, { tool_name: string; cost_usd: number; requests: number }>();
    const byClientTag = new Map<string, { client_tag: string; cost_usd: number; requests: number }>();
    const byProjectTag = new Map<string, { project_tag: string; cost_usd: number; requests: number }>();
    const byDay = new Map<string, number>();

    const dateKeys: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(dayStart);
      d.setDate(dayStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dateKeys.push(key);
      byDay.set(key, 0);
    }

    let monthTotalCost = 0;
    let monthRequests = 0;
    let monthTokens = 0;

    for (const row of outputs) {
      const cost = num(row.cost_usd);
      const inputTokens = num(row.input_tokens);
      const outputTokens = num(row.output_tokens);
      const totalTokens = inputTokens + outputTokens;

      monthTotalCost += cost;
      monthRequests += 1;
      monthTokens += totalTokens;

      const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
      const aiTool = task?.ai_tools
        ? Array.isArray(task.ai_tools)
          ? task.ai_tools[0]
          : task.ai_tools
        : null;
      const toolName = aiTool?.display_name || 'Bilinmeyen Araç';

      const currentTool = byTool.get(toolName) ?? { tool_name: toolName, cost_usd: 0, requests: 0 };
      currentTool.cost_usd += cost;
      currentTool.requests += 1;
      byTool.set(toolName, currentTool);

      const clientTag = row.client_tag || 'untagged';
      const clientRec = byClientTag.get(clientTag) ?? { client_tag: clientTag, cost_usd: 0, requests: 0 };
      clientRec.cost_usd += cost;
      clientRec.requests += 1;
      byClientTag.set(clientTag, clientRec);

      const projectTag = row.project_tag || 'untagged';
      const projectRec = byProjectTag.get(projectTag) ?? { project_tag: projectTag, cost_usd: 0, requests: 0 };
      projectRec.cost_usd += cost;
      projectRec.requests += 1;
      byProjectTag.set(projectTag, projectRec);

      const dayKey = new Date(row.created_at).toISOString().slice(0, 10);
      if (byDay.has(dayKey)) {
        byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + cost);
      }
    }

    return NextResponse.json({
      workspace_id: workspace.id,
      month_total_cost: monthTotalCost,
      month_requests: monthRequests,
      month_tokens: monthTokens,
      breakdown_by_tool: Array.from(byTool.values()).sort((a, b) => b.cost_usd - a.cost_usd),
      breakdown_by_client_tag: Array.from(byClientTag.values()).sort((a, b) => b.cost_usd - a.cost_usd),
      breakdown_by_project_tag: Array.from(byProjectTag.values()).sort((a, b) => b.cost_usd - a.cost_usd),
      daily_cost: dateKeys.map((date) => ({ date, cost_usd: byDay.get(date) ?? 0 })),
    });
  } catch (error) {
    console.error('Costs API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
