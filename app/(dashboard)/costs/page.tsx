import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, Activity, Settings2, Download, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import DailyCostChart from '@/components/costs/DailyCostChart';
import Link from 'next/link';

interface JoinOutput {
    cost_usd: string | number | null;
    created_at: string;
    tasks?: {
        ai_tools?: {
            display_name?: string;
        } | { display_name?: string }[] | null;
    } | { ai_tools?: { display_name?: string } | { display_name?: string }[] | null }[] | null;
}

const toolDotColors: Record<string, string> = {
    'ChatGPT': 'bg-green-400',
    'GPT': 'bg-green-400',
    'OpenAI': 'bg-green-400',
    'Claude': 'bg-orange-400',
    'Anthropic': 'bg-orange-400',
    'Gemini': 'bg-blue-400',
    'Google': 'bg-blue-400',
};

function getToolDotColor(name: string): string {
    for (const [key, color] of Object.entries(toolDotColors)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return 'bg-[#64748B]';
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

    return (
        <div className="h-full flex flex-col">
            <Header title="Maliyet Analizi" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-[#F1F5F9]">Maliyet Merkezi</h2>
                            <p className="text-sm text-[#64748B]">Aylık harcama, etiket ve araç bazlı dağılım</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link href={`/api/export/costs?workspaceId=${workspace.id}`} className="btn-secondary">
                                <Download size={16} />
                                Export CSV
                            </Link>
                            <Link href={`/api/export/client-summary?workspaceId=${workspace.id}`} className="btn-primary">
                                <FileSpreadsheet size={16} />
                                Download Client Report
                            </Link>
                        </div>
                    </div>

                    {/* StatCards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Toplam Harcama"
                            value={formatCurrency(totalCost)}
                            icon={DollarSign}
                            iconColor="emerald"
                        />
                        <StatCard
                            title="Bu Ay Harcama"
                            value={formatCurrency(thisMonthCost)}
                            icon={Activity}
                            iconColor="indigo"
                        />
                        <StatCard
                            title="Bu Hafta Görev"
                            value={thisWeekTasks?.toString() || '0'}
                            icon={Settings2}
                            iconColor="violet"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Araç Bazlı Maliyet Tablosu */}
                        <div className="animate-fade-scale bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-6 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-semibold text-[#F1F5F9] mb-6">Araç Bazlı Harcama</h3>
                            {breakdown.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-[#64748B]">Kayıtlı veri bulunamadı.</div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-[#1E2A3A]">
                                    <table className="min-w-[600px] w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#080C14]">
                                            <tr className="border-b border-[#1E2A3A]">
                                                <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Yapay Zeka Aracı</th>
                                                <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold text-center">İşlem Sayısı</th>
                                                <th className="px-4 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold text-right">Maliyet (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1E2A3A]/50">
                                            {breakdown.map((item, i) => (
                                                <tr key={i} className="row-hover">
                                                    <td className="px-4 py-4 text-[#F1F5F9] flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${getToolDotColor(item.name)}`} />
                                                        {item.name}
                                                    </td>
                                                    <td className="px-4 py-4 text-[#64748B] text-center">{item.count}</td>
                                                    <td className="px-4 py-4 text-emerald-400 text-right font-mono">{formatCurrency(item.cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Son 14 Gün Harcama Grafiği */}
                        <div className="animate-fade-scale bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-6 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-semibold text-[#F1F5F9] mb-6">Son 14 Gün Maliyeti</h3>
                            <DailyCostChart data={dailyData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

