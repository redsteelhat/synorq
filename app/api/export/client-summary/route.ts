import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type OutputRow = {
  created_at: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | string | null;
  client_tag: string | null;
  project_tag: string | null;
};

function asNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
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

    let workspaceQuery = supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
    if (workspaceId) workspaceQuery = workspaceQuery.eq('id', workspaceId);

    const { data: workspace, error: wsError } = await workspaceQuery.single();
    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 404 });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('outputs')
      .select('created_at, input_tokens, output_tokens, cost_usd, client_tag, project_tag')
      .eq('workspace_id', workspace.id)
      .gte('created_at', monthStart.toISOString());

    if (error) throw error;

    const grouped = new Map<
      string,
      {
        client_tag: string;
        project_tag: string;
        requests: number;
        tokens_in: number;
        tokens_out: number;
        cost_usd: number;
      }
    >();

    for (const row of (data ?? []) as OutputRow[]) {
      const clientTag = row.client_tag || 'untagged';
      const projectTag = row.project_tag || 'untagged';
      const key = `${clientTag}::${projectTag}`;
      const rec = grouped.get(key) ?? {
        client_tag: clientTag,
        project_tag: projectTag,
        requests: 0,
        tokens_in: 0,
        tokens_out: 0,
        cost_usd: 0,
      };

      rec.requests += 1;
      rec.tokens_in += asNumber(row.input_tokens);
      rec.tokens_out += asNumber(row.output_tokens);
      rec.cost_usd += asNumber(row.cost_usd);
      grouped.set(key, rec);
    }

    const rows = Array.from(grouped.values())
      .sort((a, b) => b.cost_usd - a.cost_usd)
      .map((row) => ({
        client_tag: row.client_tag,
        project_tag: row.project_tag,
        requests: row.requests,
        tokens_in: row.tokens_in,
        tokens_out: row.tokens_out,
        cost_usd: row.cost_usd.toFixed(6),
      }));

    const headers = ['client_tag', 'project_tag', 'requests', 'tokens_in', 'tokens_out', 'cost_usd'];
    const csv = toCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="synorq-client-summary-${workspace.id}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export client summary CSV error:', error);
    return NextResponse.json({ error: 'CSV oluşturulamadı' }, { status: 500 });
  }
}
