import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Plus, ArrowRight, Inbox } from 'lucide-react';

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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 max-w-6xl mx-auto">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#F1F5F9] mb-1">Tüm Görevler</h2>
                        <p className="text-sm text-[#64748B]">AI ile oluşturulan görev geçmişinizi yönetin.</p>
                    </div>
                    <Link
                        href="/tasks/new"
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        New Task
                    </Link>
                </div>

                <div className="animate-fade-scale bg-[#0D1321] border border-[#1E2A3A] rounded-xl overflow-hidden max-w-6xl mx-auto flex flex-col min-h-[400px]">
                    {!tasks || tasks.length === 0 ? (
                        <div className="m-6 empty-state flex-1 flex flex-col items-center justify-center">
                            <div className="empty-state-icon">
                                <Inbox size={20} className="text-[#334155]" />
                            </div>
                            <h3 className="text-[#F1F5F9] font-medium mb-1">Henüz görev yok</h3>
                            <p className="text-sm text-[#64748B] max-w-xs mx-auto text-center mb-6">
                                AI araçlarını kullanarak yeni görevler oluşturabilir ve süreçleri otomatize edebilirsiniz.
                            </p>
                            <Link
                                href="/tasks/new"
                                className="btn-primary px-5"
                            >
                                <Plus size={16} />
                                İlk görevini oluştur
                            </Link>
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="overflow-x-auto rounded-lg border border-[#1E2A3A]">
                                <table className="min-w-[600px] w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#080C14]">
                                        <tr className="border-b border-[#1E2A3A]">
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Başlık</th>
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Araç</th>
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Status</th>
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Maliyet</th>
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold">Tarih</th>
                                            <th className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#334155] font-semibold w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2A3A]/50">
                                        {tasks.map((task: { id: string, title: string, status: string, created_at: string, ai_tools: { display_name: string } | { display_name: string }[] | null, outputs: { cost_usd: number } | { cost_usd: number }[] | null }) => {
                                            let badgeColor = "bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]";
                                            const label = task.status;
                                            if (task.status === 'done') {
                                                badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                            } else if (task.status === 'pending') {
                                                badgeColor = "bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]";
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
                                                <tr key={task.id} className="group row-hover">
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            href={`/tasks/${task.id}`}
                                                            className="block max-w-[200px] truncate font-medium text-[#F1F5F9] hover:text-indigo-400 transition-colors"
                                                            title={task.title}
                                                        >
                                                            {task.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-[#64748B]">
                                                        {toolName || 'Seçilmedi'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border rounded-full ${badgeColor}`}>
                                                            {label.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[#F1F5F9] font-mono">
                                                        {cost ? `$${Number(cost).toFixed(5)}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-[#64748B] text-xs">
                                                        {timeAgo(task.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={`/tasks/${task.id}`}
                                                            className="inline-flex p-2 rounded-lg text-[#334155] group-hover:bg-[#111827] group-hover:text-indigo-400 transition-colors"
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
