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
                    <h2 className="text-white text-2xl font-bold mb-1">
                        Hoş geldin 👋
                    </h2>
                    <p className="text-slate-400">
                        {workspaceName} — {workspacePlan.charAt(0).toUpperCase() + workspacePlan.slice(1)} Plan
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Tasks"
                        value={totalTasks}
                        icon={CheckSquare}
                    />
                    <StatCard
                        title="This Month Cost"
                        value={`$${thisMonthCost.toFixed(4)}`}
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Active Tools"
                        value={activeTools}
                        icon={Cpu}
                    />
                    <StatCard
                        title="Prompt Library"
                        value={promptLibraryCount}
                        icon={FileText}
                    />
                </div>

                {/* Recent Tasks */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <CheckSquare size={18} className="text-indigo-400" />
                            Recent Tasks
                        </h3>
                        <Link href="/tasks" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            View All →
                        </Link>
                    </div>

                    {recentTasks.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Henüz görev bulunmuyor. <Link href="/tasks/new" className="text-indigo-400 hover:underline">İlk görevi oluştur</Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {recentTasks.map((task: { id: string, title: string, status: string, created_at: string, ai_tools: { display_name: string } | { display_name: string }[] | null }) => {
                                let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                                const label = task.status;
                                if (task.status === 'done') {
                                    badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";
                                } else if (task.status === 'pending') {
                                    badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                                } else if (task.status === 'running') {
                                    badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                } else if (task.status === 'failed') {
                                    badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                                }

                                const toolName = Array.isArray(task.ai_tools) ? task.ai_tools[0]?.display_name : task.ai_tools?.display_name;

                                return (
                                    <div key={task.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm font-medium text-slate-200">{task.title}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <span>{toolName || 'Araç seçilmedi'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span>{new Date(task.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${badgeColor}`}>
                                                {label.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Dashboard datası çekilirken hata oluştu:", error);
        return (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl mx-4 md:mx-8 my-8 text-slate-400">
                <AlertCircle size={40} className="mx-auto text-rose-400 mb-4" />
                <p>Veriler yüklenirken bir hata oluştu.</p>
                <p className="text-sm mt-2 text-slate-500">Lütfen daha sonra tekrar deneyin.</p>
            </div>
        );
    }
}



function DashboardSkeleton() {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-pulse">
            <div className="mb-4">
                <div className="h-8 w-48 bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-64 bg-slate-800 rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[148px] bg-slate-800 rounded-xl border border-slate-700"></div>
                ))}
            </div>
            <div className="h-64 bg-slate-800 rounded-xl border border-slate-700"></div>
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
        // İlk giriş: workspace oluştur
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
