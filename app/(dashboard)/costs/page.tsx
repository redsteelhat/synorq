import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, Activity, Settings2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface JoinOutput {
    cost_usd: string | number | null;
    created_at: string;
    tasks?: {
        ai_tools?: {
            display_name?: string;
        } | { display_name?: string }[] | null;
    } | { ai_tools?: { display_name?: string } | { display_name?: string }[] | null }[] | null;
}

export default async function CostsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    // Join ile tüm verileri sunucuya indirelim (veri artınca optimize edilmeli ama şimdilik en iyisi)
    const { data: allOutputs } = await supabase
        .from('outputs')
        .select(`
            cost_usd, 
            created_at, 
            tasks(ai_tools(display_name))
        `)
        .eq('workspace_id', workspace.id);

    const outputs: JoinOutput[] = (allOutputs as unknown as JoinOutput[]) || [];
    const totalCost = outputs.reduce((sum, curr) => sum + (Number(curr.cost_usd) || 0), 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCost = outputs
        .filter(o => new Date(o.created_at) >= firstDayOfMonth)
        .reduce((sum, curr) => sum + (Number(curr.cost_usd) || 0), 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { count: thisWeekTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id)
        .gte('created_at', lastWeek.toISOString());

    // d) Araç Breakdown
    const toolStats = new Map<string, { count: number; cost: number }>();
    outputs.forEach((o: JoinOutput) => {
        const cost = Number(o.cost_usd) || 0;
        let tName = 'Bilinmeyen Araç';

        if (o.tasks) {
            const task = Array.isArray(o.tasks) ? o.tasks[0] : o.tasks;
            if (task && task.ai_tools) {
                const aiTool = Array.isArray(task.ai_tools) ? task.ai_tools[0] : task.ai_tools;
                if (aiTool && aiTool.display_name) {
                    tName = aiTool.display_name;
                }
            }
        }

        const stats = toolStats.get(tName) || { count: 0, cost: 0 };
        stats.count += 1;
        stats.cost += cost;
        toolStats.set(tName, stats);
    });

    const breakdown = Array.from(toolStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.cost - a.cost);

    // e) Son 14 Gün Verisi
    const last14Days = Array.from({ length: 14 })
        .map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d.toISOString().split('T')[0];
        })
        .reduce((acc, date) => {
            acc[date] = 0;
            return acc;
        }, {} as Record<string, number>);

    outputs.forEach(o => {
        const d = new Date(o.created_at).toISOString().split('T')[0];
        if (last14Days.hasOwnProperty(d)) {
            last14Days[d] += (Number(o.cost_usd) || 0);
        }
    });

    const dailyData = Object.entries(last14Days).map(([date, cost]) => ({ date, cost }));
    const maxDailyCost = Math.max(...dailyData.map(d => d.cost), 0.0001); // Sıfıra bölünmeyi önle

    return (
        <div className="h-full flex flex-col">
            <Header title="Maliyet Analizi" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* StatCards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Toplam Harcama"
                            value={formatCurrency(totalCost)}
                            icon={DollarSign}
                        />
                        <StatCard
                            title="Bu Ay Harcama"
                            value={formatCurrency(thisMonthCost)}
                            icon={Activity}
                        />
                        <StatCard
                            title="Bu Hafta Görev"
                            value={thisWeekTasks?.toString() || '0'}
                            icon={Settings2}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Araç Bazlı Maliyet Tablosu */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-white mb-6">Araç Bazlı Harcama</h3>
                            {breakdown.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-slate-500">Kayıtlı veri bulunamadı.</div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-800">
                                    <table className="min-w-[600px] w-full text-left text-sm whitespace-nowrap">
                                        <thead className="text-slate-400 border-b border-slate-800">
                                            <tr>
                                                <th className="pb-3 font-medium">Yapay Zeka Aracı</th>
                                                <th className="pb-3 font-medium text-center">İşlem Sayısı</th>
                                                <th className="pb-3 font-medium text-right">Maliyet (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {breakdown.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-4 text-slate-200">{item.name}</td>
                                                    <td className="py-4 text-slate-400 text-center">{item.count}</td>
                                                    <td className="py-4 text-emerald-400 text-right font-mono">{formatCurrency(item.cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Son 14 Gün Harcama Grafiği (Bar/Table) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-white mb-6">Son 14 Gün Maliyeti</h3>
                            <div className="flex-1 flex flex-col justify-end space-y-3">
                                {dailyData.map((d, i) => {
                                    const widthPercent = (d.cost / maxDailyCost) * 100;
                                    const dateLabel = new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

                                    return (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                            <div className="w-16 shrink-0 text-slate-500 text-xs text-right">
                                                {dateLabel}
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="h-2.5 bg-slate-800 rounded-full flex-1 overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500 relative min-w-[2px]"
                                                        style={{ width: `${widthPercent}%` }}
                                                    />
                                                </div>
                                                <div className="w-20 shrink-0 text-right font-mono text-[11px] text-slate-400">
                                                    {d.cost > 0 ? formatCurrency(d.cost) : '$0.0000'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
