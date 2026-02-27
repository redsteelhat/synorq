import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import type { CostSummary } from '@/types';

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

    let costs: CostSummary = { totalCostUsd: 0, byTool: [], byDay: [] };

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/costs?workspaceId=${workspace.id}`,
            { cache: 'no-store' }
        );
        if (res.ok) costs = await res.json();
    } catch {
        // Hata varsa defaults kullan
    }

    return (
        <div>
            <Header title="Maliyetler" />
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-white text-2xl font-bold">Maliyet Analizi</h2>
                    <p className="text-slate-400 mt-1">Token bazlı AI harcamaları</p>
                </div>

                {/* Total Cost */}
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-700/30 rounded-2xl p-8 mb-8 text-center">
                    <p className="text-slate-400 text-sm mb-2">Toplam Harcama</p>
                    <p className="text-5xl font-bold text-white mb-1">
                        ${costs.totalCostUsd.toFixed(4)}
                    </p>
                    <p className="text-slate-500 text-sm">Tüm zamanlar</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Tool */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Araç Bazlı Harcama</h3>
                        {costs.byTool.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">Veri yok</p>
                        ) : (
                            <div className="space-y-3">
                                {costs.byTool.map((item) => (
                                    <div key={item.toolName} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white text-sm font-medium">{item.toolName}</p>
                                            <p className="text-slate-500 text-xs">{item.taskCount} görev</p>
                                        </div>
                                        <span className="text-purple-400 font-mono text-sm">
                                            ${item.costUsd.toFixed(4)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* By Day */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-4">Günlük Harcama (Son 30 Gün)</h3>
                        {costs.byDay.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center">Veri yok</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {costs.byDay.map((item) => (
                                    <div key={item.date} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">{item.date}</span>
                                        <span className="text-white font-mono">${item.costUsd.toFixed(6)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
