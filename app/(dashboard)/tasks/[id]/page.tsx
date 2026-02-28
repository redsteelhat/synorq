import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import CopyButton from '@/components/tasks/CopyButton';
import RunAgainButton from '@/components/tasks/RunAgainButton';
import Link from 'next/link';
import { ArrowLeft, Clock, DollarSign, Database, Hash, AlertTriangle } from 'lucide-react';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    const { data: task, error } = await supabase
        .from('tasks')
        .select(`
            *,
            ai_tools (name, display_name, model),
            outputs (id, content, input_tokens, output_tokens, cost_usd, duration_ms, error, created_at)
        `)
        .eq('id', params.id)
        .eq('workspace_id', workspace.id)
        .single();

    if (error || !task) {
        return (
            <div className="h-full flex flex-col">
                <Header title="Görev Bulunamadı" />
                <div className="flex-1 p-8 flex flex-col items-center justify-center">
                    <p className="text-[#64748B] mb-4">Bu görev silinmiş veya erişim izniniz yok.</p>
                    <Link href="/tasks" className="text-indigo-400 hover:underline">← Görevlere Dön</Link>
                </div>
            </div>
        );
    }

    const output = Array.isArray(task.outputs) ? task.outputs[task.outputs.length - 1] : task.outputs;

    let badgeColor = "bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]";
    if (task.status === 'done') badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    else if (task.status === 'pending') badgeColor = "bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]";
    else if (task.status === 'running') badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    else if (task.status === 'failed') badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";

    const toolName = task.ai_tools && !Array.isArray(task.ai_tools) ? task.ai_tools.display_name : 'Bilinmeyen Araç';
    const contentText = output?.content || output?.error || 'Henüz çıktı yok.';

    return (
        <div className="h-full flex flex-col">
            <Header title="Görev Detayı" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto space-y-6">

                {/* Gezinme ve Başlık Alanı */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/tasks" className="inline-flex items-center gap-1 text-sm font-medium text-[#64748B] hover:text-indigo-400 mb-2 transition-colors">
                            <ArrowLeft size={16} /> Görevler
                        </Link>
                        <h2 className="text-2xl font-bold text-[#F1F5F9] flex gap-3 items-center">
                            {task.title}
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeColor}`}>
                                {task.status.toUpperCase()}
                            </span>
                        </h2>
                        <div className="text-sm text-[#64748B] flex items-center gap-2">
                            <span>{toolName}</span>
                            <span className="w-1 h-1 rounded-full bg-[#1E2A3A]"></span>
                            <span>{new Date(task.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <RunAgainButton taskId={task.id} workspaceId={workspace.id} />
                    </div>
                </div>

                {/* Çıktı Kutusu */}
                <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-[#1E2A3A] flex justify-between items-center bg-[#080C14]/80">
                        <h3 className="font-semibold text-[#F1F5F9]">AI Çıktısı</h3>
                        {output?.content && (
                            <CopyButton text={output.content} />
                        )}
                    </div>
                    <div className="p-6 overflow-y-auto max-h-96 min-h-[200px] bg-[#080C14]">
                        {output?.error ? (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400 text-sm">
                                <AlertTriangle size={18} className="mt-0.5" />
                                <div className="font-mono whitespace-pre-wrap">{output.error}</div>
                            </div>
                        ) : (
                            <pre className="font-mono text-[13px] leading-relaxed text-[#F1F5F9] whitespace-pre-wrap break-words">
                                {contentText}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Maliyet & İstatistik Grid'i */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-5 space-y-2">
                        <div className="flex items-center text-[#64748B] gap-2 mb-1">
                            <Database size={16} /> <span className="text-sm font-medium">Input Tokens</span>
                        </div>
                        <p className="text-2xl font-semibold text-[#F1F5F9]">
                            {output?.input_tokens ? output.input_tokens.toLocaleString() : '-'}
                        </p>
                    </div>

                    <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-5 space-y-2">
                        <div className="flex items-center text-[#64748B] gap-2 mb-1">
                            <Hash size={16} /> <span className="text-sm font-medium">Output Tokens</span>
                        </div>
                        <p className="text-2xl font-semibold text-[#F1F5F9]">
                            {output?.output_tokens ? output.output_tokens.toLocaleString() : '-'}
                        </p>
                    </div>

                    <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-5 space-y-2">
                        <div className="flex items-center text-[#64748B] gap-2 mb-1">
                            <DollarSign size={16} /> <span className="text-sm font-medium">Toplam Maliyet</span>
                        </div>
                        <p className="text-2xl font-semibold text-emerald-400">
                            {output?.cost_usd ? `$${Number(output.cost_usd).toFixed(5)}` : '-'}
                        </p>
                    </div>

                    <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-5 space-y-2">
                        <div className="flex items-center text-[#64748B] gap-2 mb-1">
                            <Clock size={16} /> <span className="text-sm font-medium">Süre</span>
                        </div>
                        <p className="text-2xl font-semibold text-[#F1F5F9]">
                            {output?.duration_ms ? `${(output.duration_ms / 1000).toFixed(2)}s` : '-'}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
