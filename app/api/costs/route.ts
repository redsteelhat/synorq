import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId zorunludur' }, { status: 400 });
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 403 });
        }

        // Toplam maliyet
        const { data: totals } = await supabase
            .from('outputs')
            .select('cost_usd')
            .eq('workspace_id', workspaceId);

        const totalCostUsd = (totals ?? []).reduce((sum, r) => sum + Number(r.cost_usd), 0);

        // Araç bazlı maliyet
        const { data: byToolRaw } = await supabase
            .from('outputs')
            .select('cost_usd, tasks!inner(tool_id, ai_tools!inner(display_name))')
            .eq('workspace_id', workspaceId);

        const toolMap = new Map<string, { costUsd: number; taskCount: number }>();
        for (const row of byToolRaw ?? []) {
            const taskArr = row.tasks as { ai_tools?: { display_name?: string } } | { ai_tools?: { display_name?: string } }[];
            const task = Array.isArray(taskArr) ? taskArr[0] : taskArr;
            const toolName = task?.ai_tools?.display_name ?? 'Bilinmeyen';
            const existing = toolMap.get(toolName) ?? { costUsd: 0, taskCount: 0 };
            toolMap.set(toolName, {
                costUsd: existing.costUsd + Number(row.cost_usd),
                taskCount: existing.taskCount + 1,
            });
        }

        const byTool = Array.from(toolMap.entries()).map(([toolName, data]) => ({
            toolName,
            costUsd: data.costUsd,
            taskCount: data.taskCount,
        }));

        // Günlük maliyet (son 30 gün)
        const { data: byDayRaw } = await supabase
            .from('outputs')
            .select('cost_usd, created_at')
            .eq('workspace_id', workspaceId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true });

        const dayMap = new Map<string, number>();
        for (const row of byDayRaw ?? []) {
            const date = row.created_at.split('T')[0];
            dayMap.set(date, (dayMap.get(date) ?? 0) + Number(row.cost_usd));
        }

        const byDay = Array.from(dayMap.entries()).map(([date, costUsd]) => ({ date, costUsd }));

        return NextResponse.json({ totalCostUsd, byTool, byDay });
    } catch (error) {
        console.error('Costs GET hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
