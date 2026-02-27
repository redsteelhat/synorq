import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Plus, ArrowRight, ListTodo } from 'lucide-react';

import { timeAgo } from '@/lib/utils';

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

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id, title, status, created_at,
            ai_tools (display_name),
            outputs (cost_usd)
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="h-full flex flex-col">
                <Header title="Görevler" />
                <div className="flex-1 p-8 text-center text-red-400">
                    Görevler yüklenirken hata oluştu.
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <Header title="Görevler" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Tüm Görevler</h2>
                        <p className="text-sm text-slate-400">AI ile oluşturulan görev geçmişinizi yönetin.</p>
                    </div>
                    <Link
                        href="/tasks/new"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={18} />
                        New Task
                    </Link>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm max-w-6xl mx-auto flex flex-col min-h-[400px]">
                    {!tasks || tasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <ListTodo size={32} />
                            </div>
                            <h3 className="text-white font-medium mb-2">Henüz görev yok</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm">
                                AI araçlarını kullanarak yeni görevler oluşturabilir ve süreçleri otomatize edebilirsiniz.
                            </p>
                            <Link
                                href="/tasks/new"
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                İlk görevini oluştur
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Başlık</th>
                                        <th className="px-6 py-4 font-medium">Araç</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Maliyet</th>
                                        <th className="px-6 py-4 font-medium">Tarih</th>
                                        <th className="px-6 py-4 font-medium w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {tasks.map((task: { id: string, title: string, status: string, created_at: string, ai_tools: { display_name: string } | { display_name: string }[] | null, outputs: { cost_usd: number } | { cost_usd: number }[] | null }) => {
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

                                        const cost = Array.isArray(task.outputs)
                                            ? task.outputs[task.outputs.length - 1]?.cost_usd
                                            : task.outputs?.cost_usd;

                                        const toolName = Array.isArray(task.ai_tools)
                                            ? task.ai_tools[0]?.display_name
                                            : task.ai_tools?.display_name;

                                        return (
                                            <tr key={task.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <Link href={`/tasks/${task.id}`} className="font-medium text-slate-200 hover:text-indigo-400 transition-colors">
                                                        {task.title}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {toolName || 'Seçilmedi'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-[11px] font-medium border rounded-full ${badgeColor}`}>
                                                        {label.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 font-mono">
                                                    {cost ? `$${Number(cost).toFixed(5)}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">
                                                    {timeAgo(task.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/tasks/${task.id}`}
                                                        className="inline-flex p-2 rounded-lg text-slate-500 group-hover:bg-slate-800 group-hover:text-indigo-400 transition-colors"
                                                    >
                                                        <ArrowRight size={16} />
                                                    </Link>
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
        </div>
    );
}
