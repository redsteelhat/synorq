import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import { Plus } from 'lucide-react';
import type { Task } from '@/types';

export default async function TasksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      *,
      ai_tools (id, name, display_name, model),
      prompts (id, name),
      outputs (id, cost_usd, model_used, error)
    `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    const statusColors: Record<string, string> = {
        done: 'bg-green-900/30 text-green-400',
        pending: 'bg-yellow-900/30 text-yellow-400',
        running: 'bg-blue-900/30 text-blue-400 animate-pulse',
        failed: 'bg-red-900/30 text-red-400',
    };

    const statusLabels: Record<string, string> = {
        done: 'Tamamlandı',
        pending: 'Bekliyor',
        running: 'Çalışıyor',
        failed: 'Başarısız',
    };

    return (
        <div>
            <Header title="Görevler" />
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-white text-2xl font-bold">Görevler</h2>
                        <p className="text-slate-400 mt-1">{tasks?.length ?? 0} görev</p>
                    </div>
                    <Link
                        href="/tasks/new"
                        id="new-task-btn"
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    >
                        <Plus size={16} />
                        Yeni Görev
                    </Link>
                </div>

                {!tasks || tasks.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                        <p className="text-slate-400 mb-4">Henüz görev yok.</p>
                        <Link
                            href="/tasks/new"
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                            İlk görevi oluştur →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task: Task & { ai_tools?: { display_name: string }; outputs?: { cost_usd: number; error: string | null }[] }) => (
                            <div
                                key={task.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{task.title}</h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {task.ai_tools?.display_name ?? 'Araç seçilmedi'} •{' '}
                                            {new Date(task.created_at).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                        {task.outputs && task.outputs.length > 0 && (
                                            <p className="text-slate-600 text-xs mt-1">
                                                Maliyet: ${task.outputs.reduce((s, o) => s + Number(o.cost_usd), 0).toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-4 flex-shrink-0 ${statusColors[task.status]}`}>
                                        {statusLabels[task.status]}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
