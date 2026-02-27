import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import StatCard from '@/components/dashboard/StatCard';
import { ListTodo, DollarSign, Wrench, BookOpen } from 'lucide-react';

async function getDashboardData(workspaceId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const [tasksRes, costsRes, toolsRes, promptsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/tasks?workspaceId=${workspaceId}`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/costs?workspaceId=${workspaceId}`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/tools?workspaceId=${workspaceId}`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/prompts?workspaceId=${workspaceId}`, { cache: 'no-store' }),
    ]);

    const tasks = tasksRes.status === 'fulfilled' && tasksRes.value.ok
        ? (await tasksRes.value.json()).tasks ?? []
        : [];
    const costs = costsRes.status === 'fulfilled' && costsRes.value.ok
        ? await costsRes.value.json()
        : { totalCostUsd: 0 };
    const tools = toolsRes.status === 'fulfilled' && toolsRes.value.ok
        ? (await toolsRes.value.json()).tools ?? []
        : [];
    const prompts = promptsRes.status === 'fulfilled' && promptsRes.value.ok
        ? (await promptsRes.value.json()).prompts ?? []
        : [];

    return { tasks, costs, tools, prompts };
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
                    <p className="text-red-400">Workspace oluşturulamadı. Sayfayı yenileyin.</p>
                </div>
            );
        }

        redirect('/dashboard');
    }

    const { tasks, costs, tools, prompts } = await getDashboardData(workspace.id);

    const activeTools = tools.filter((t: { is_active: boolean }) => t.is_active).length;
    const thisMonthCost = costs.totalCostUsd ?? 0;

    return (
        <div>
            <Header title="Dashboard" />
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-white text-2xl font-bold mb-1">
                        Hoş geldin 👋
                    </h2>
                    <p className="text-slate-400">
                        {workspace.name} — {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} Plan
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Toplam Görev"
                        value={tasks.length}
                        subtitle={`${tasks.filter((t: { status: string }) => t.status === 'done').length} tamamlandı`}
                        icon={ListTodo}
                    />
                    <StatCard
                        title="Bu Ay Harcama"
                        value={`$${thisMonthCost.toFixed(4)}`}
                        subtitle="Tüm AI araçları"
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Aktif AI Araç"
                        value={activeTools}
                        subtitle={`${tools.length} araç tanımlı`}
                        icon={Wrench}
                    />
                    <StatCard
                        title="Prompt Sayısı"
                        value={prompts.length}
                        subtitle="Kütüphanenizdeki"
                        icon={BookOpen}
                    />
                </div>

                {/* Recent Tasks */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Son Görevler</h3>
                    {tasks.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-8">
                            Henüz görev yok. <a href="/tasks/new" className="text-purple-400 hover:underline">İlk görevi oluştur →</a>
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.slice(0, 5).map((task: {
                                id: string;
                                title: string;
                                status: string;
                                created_at: string;
                                ai_tools?: { display_name: string };
                            }) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                                >
                                    <div>
                                        <p className="text-white text-sm font-medium">{task.title}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            {task.ai_tools?.display_name ?? 'Araç seçilmedi'} •{' '}
                                            {new Date(task.created_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <span className={`
                    text-xs font-medium px-2.5 py-1 rounded-full
                    ${task.status === 'done' ? 'bg-green-900/30 text-green-400' : ''}
                    ${task.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : ''}
                    ${task.status === 'running' ? 'bg-blue-900/30 text-blue-400' : ''}
                    ${task.status === 'failed' ? 'bg-red-900/30 text-red-400' : ''}
                  `}>
                                        {task.status === 'done' ? 'Tamamlandı' : ''}
                                        {task.status === 'pending' ? 'Bekliyor' : ''}
                                        {task.status === 'running' ? 'Çalışıyor' : ''}
                                        {task.status === 'failed' ? 'Başarısız' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
