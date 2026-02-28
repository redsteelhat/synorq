import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type OutputRow = {
  created_at: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | string | null;
  duration_ms: number | null;
  client_tag: string | null;
  project_tag: string | null;
  tasks?: { ai_tools?: { display_name?: string } | { display_name?: string }[] | null } | { ai_tools?: { display_name?: string } | { display_name?: string }[] | null }[] | null;
};

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

    let workspaceQuery = supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
    if (workspaceId) workspaceQuery = workspaceQuery.eq('id', workspaceId);

    const { data: workspace, error: wsError } = await workspaceQuery.single();
    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 404 });
    }

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('outputs')
      .select(
        'created_at, input_tokens, output_tokens, cost_usd, duration_ms, client_tag, project_tag, tasks(ai_tools(display_name))'
      )
      .eq('workspace_id', workspace.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows = ((data ?? []) as OutputRow[]).map((row) => {
      const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
      const aiTool = task?.ai_tools
        ? Array.isArray(task.ai_tools)
          ? task.ai_tools[0]
          : task.ai_tools
        : null;

      return {
        date: new Date(row.created_at).toISOString(),
        tool: aiTool?.display_name || 'Bilinmeyen Araç',
        client_tag: row.client_tag || '',
        project_tag: row.project_tag || '',
        tokens_in: row.input_tokens ?? 0,
        tokens_out: row.output_tokens ?? 0,
        cost_usd: Number(row.cost_usd ?? 0).toFixed(6),
        duration_ms: row.duration_ms ?? 0,
      };
    });

    const headers = [
      'date',
      'tool',
      'client_tag',
      'project_tag',
      'tokens_in',
      'tokens_out',
      'cost_usd',
      'duration_ms',
    ];
    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="synorq-costs-${workspace.id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export costs CSV error:', error);
    return NextResponse.json({ error: 'CSV oluşturulamadı' }, { status: 500 });
  }
}
