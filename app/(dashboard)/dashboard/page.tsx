import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import StatCard from '@/components/dashboard/StatCard';
import { CheckSquare, FileText, Cpu, DollarSign, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function DashboardContent({ workspaceId, workspaceName, workspacePlan }: { workspaceId: string, workspaceName: string, workspacePlan: string }) {
    const supabase = await createClient();

    try {
        const pTasks = supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
        const pTools = supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_active', true);
        const pPrompts = supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
        const pCosts = supabase.from('outputs').select('cost_usd').eq('workspace_id', workspaceId);
        const pRecent = supabase.from('tasks')
            .select(`id, title, status, created_at, ai_tools (display_name)`)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(5);

        const [tasksRes, toolsRes, promptsRes, costsRes, recentRes] = await Promise.all([
            pTasks, pTools, pPrompts, pCosts, pRecent
        ]);

        const totalTasks = tasksRes.count ?? 0;
        const activeTools = toolsRes.count ?? 0;
        const promptLibraryCount = promptsRes.count ?? 0;

        const thisMonthCost = (costsRes.data ?? []).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);
        const recentTasks = recentRes.data ?? [];

        return (
            <div className="p-4 md:p-8 space-y-8">
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-[#F1F5F9] mb-1">Dashboard</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-[#64748B]">{workspaceName}</p>
                        <span className="rounded-full border border-[#2D3F55] bg-[#1E2A3A] px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#64748B]">
                            {workspacePlan.charAt(0).toUpperCase() + workspacePlan.slice(1)} Plan
                        </span>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Tasks"
                        value={totalTasks}
                        icon={CheckSquare}
                        iconColor="indigo"
                    />
                    <StatCard
                        title="This Month Cost"
                        value={`$${thisMonthCost.toFixed(4)}`}
                        icon={DollarSign}
                        iconColor="emerald"
                    />
                    <StatCard
                        title="Active Tools"
                        value={activeTools}
                        icon={Cpu}
                        iconColor="violet"
                    />
                    <StatCard
                        title="Prompt Library"
                        value={promptLibraryCount}
                        icon={FileText}
                        iconColor="amber"
                    />
                </div>

                {/* Recent Tasks */}
                <div className="animate-fade-scale bg-[#0D1321] border border-[#1E2A3A] rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#1E2A3A] flex items-center justify-between">
                        <h3 className="text-[#F1F5F9] font-semibold text-sm">Recent Tasks</h3>
                        <Link href="/tasks" className="btn-secondary px-3 py-1.5 text-xs">
                            View All →
                        </Link>
                    </div>

                    {recentTasks.length === 0 ? (
                        <div className="m-6 empty-state">
                            <div className="empty-state-icon">
                                <CheckSquare size={20} className="text-[#334155]" />
                            </div>
                            <p className="text-[#F1F5F9] font-medium mb-1">Henüz görev bulunmuyor</p>
                            <p className="mx-auto mb-6 max-w-xs text-center text-sm text-[#64748B]">
                                İlk otomasyon görevini oluşturup bu alanda çıktıları takip et.
                            </p>
                            <Link href="/tasks/new" className="btn-primary px-5">
                                İlk görevi oluştur
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[680px] w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#080C14]">
                                    <tr className="border-b border-[#1E2A3A]">
                                        <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Task</th>
                                        <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Tool</th>
                                        <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Date</th>
                                        <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTasks.map((task: { id: string, title: string, status: string, created_at: string, ai_tools: { display_name: string } | { display_name: string }[] | null }) => {
                                        let badgeColor = "bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]";
                                        const label = task.status;
                                        if (task.status === 'done') {
                                            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                        } else if (task.status === 'running') {
                                            badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                        } else if (task.status === 'failed') {
                                            badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                                        }

                                        const toolName = Array.isArray(task.ai_tools) ? task.ai_tools[0]?.display_name : task.ai_tools?.display_name;

                                        return (
                                            <tr key={task.id} className="border-b border-[#1E2A3A]/50 row-hover">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-[#F1F5F9]">{task.title}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[#64748B]">{toolName || 'Araç seçilmedi'}</td>
                                                <td className="px-6 py-4 text-xs text-[#64748B]">{new Date(task.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badgeColor}`}>
                                                        {label.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Dashboard datası çekilirken hata oluştu:", error);
        return (
            <div className="p-8 text-center bg-[#0D1321] border border-[#1E2A3A] rounded-xl mx-4 md:mx-8 my-8 text-[#64748B]">
                <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
                <p>Veriler yüklenirken bir hata oluştu.</p>
                <p className="text-sm mt-2 text-[#334155]">Lütfen daha sonra tekrar deneyin.</p>
            </div>
        );
    }
}



function DashboardSkeleton() {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-pulse">
            <div className="mb-4">
                <div className="h-8 w-48 bg-[#1E2A3A] rounded mb-2"></div>
                <div className="h-4 w-64 bg-[#1E2A3A] rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[148px] bg-[#0D1321] rounded-xl border border-[#1E2A3A]"></div>
                ))}
            </div>
            <div className="h-64 bg-[#0D1321] rounded-xl border border-[#1E2A3A]"></div>
        </div>
    );
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) {
        const { data: newWorkspace } = await supabase
            .from('workspaces')
            .insert({ name: `${user.user_metadata?.full_name ?? user.email}'in Workspace'i`, owner_id: user.id })
            .select()
            .single();

        if (!newWorkspace) {
            return (
                <div className="p-8">
                    <p className="text-red-400">Workspace oluşturulamadı. Lütfen sayfayı yenileyin.</p>
                </div>
            );
        }
        redirect('/dashboard');
    }

    return (
        <div className="h-full">
            <Header title="Dashboard" />
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardContent
                    workspaceId={workspace.id}
                    workspaceName={workspace.name || ''}
                    workspacePlan={workspace.plan || 'free'}
                />
            </Suspense>
        </div>
    );
}
