'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AITool, Prompt } from '@/types';
import { Loader2 } from 'lucide-react';

interface TaskFormProps {
    workspaceId: string;
    tools: Pick<AITool, 'id' | 'name' | 'display_name' | 'model'>[];
    prompts: Pick<Prompt, 'id' | 'name' | 'content'>[];
}

export default function TaskForm({ workspaceId, tools, prompts }: TaskFormProps) {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [toolId, setToolId] = useState(tools[0]?.id ?? '');
    const [promptMode, setPromptMode] = useState<'library' | 'custom'>('library');
    const [selectedPromptId, setSelectedPromptId] = useState(prompts[0]?.id ?? '');
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Lütfen bir başlık girin.');
            return;
        }

        if (!toolId) {
            toast.error('Lütfen bir AI aracı seçin.');
            return;
        }

        if (promptMode === 'library' && !selectedPromptId) {
            toast.error('Lütfen kütüphaneden bir prompt seçin.');
            return;
        }

        if (promptMode === 'custom' && !customPrompt.trim()) {
            toast.error('Lütfen serbest yazım için bir prompt girin.');
            return;
        }

        setLoading(true);

        try {
            // 1. Task Oluştur
            const taskRes = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    title,
                    toolId,
                    promptId: promptMode === 'library' ? selectedPromptId : undefined,
                    customPrompt: promptMode === 'custom' ? customPrompt : undefined,
                })
            });

            if (!taskRes.ok) {
                const errData = await taskRes.json();
                throw new Error(errData.error || 'Görev oluşturulamadı');
            }

            const { task } = await taskRes.json();

            // Kullanıcıya oluşturulduğunu bildir
            toast.info('Görev oluşturuldu, AI çalışıyor...');

            // 2. Task Run Tetikle
            const runRes = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: task.id,
                    workspaceId
                })
            });

            if (!runRes.ok) {
                const errData = await runRes.json();
                throw new Error(errData.error || 'Görev başarısız oldu');
            }

            toast.success('Görev başarıyla tamamlandı!');
            router.push(`/tasks/${task.id}`);
            router.refresh();

        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                toast.error(error.message || 'Bilinmeyen bir hata oluştu');
            } else {
                toast.error('Bilinmeyen bir hata oluştu');
            }
            setLoading(false);
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-6">Yeni Görev</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-300">Başlık <span className="text-rose-400">*</span></label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Örn: Pazarlama e-postası taslağı..."
                        disabled={loading}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    />
                </div>

                {/* AI Tool Select */}
                <div className="space-y-2">
                    <label htmlFor="tool" className="block text-sm font-medium text-slate-300">AI Aracı <span className="text-rose-400">*</span></label>
                    {tools.length === 0 ? (
                        <div className="bg-slate-800/50 border border-amber-900/50 rounded-lg px-4 py-3 text-sm text-amber-400">
                            Workspace&apos;inizde aktif bir AI aracı bulunmuyor. Görev oluşturmak için menüden &quot;AI Araçlar&quot; sayfasına gidip bir araç ekleyin.
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                id="tool"
                                value={toolId}
                                onChange={(e) => setToolId(e.target.value)}
                                disabled={loading || tools.length === 0}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 appearance-none pr-10"
                            >
                                <option value="" disabled>Lütfen bir AI aracı seçin</option>
                                {tools.map(tool => (
                                    <option key={tool.id} value={tool.id}>
                                        {tool.display_name} ({tool.model})
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Prompt Type Toggle */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">Prompt Seçimi</label>
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit">
                        <button
                            type="button"
                            onClick={() => setPromptMode('library')}
                            disabled={loading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${promptMode === 'library'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Kütüphaneden Seç
                        </button>
                        <button
                            type="button"
                            onClick={() => setPromptMode('custom')}
                            disabled={loading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${promptMode === 'custom'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Serbest Yaz
                        </button>
                    </div>

                    {/* Prompt Configuration */}
                    <div className="pt-2">
                        {promptMode === 'library' ? (
                            <div className="space-y-4">
                                {prompts.length === 0 ? (
                                    <div className="bg-slate-800/50 border border-amber-900/50 rounded-lg px-4 py-3 text-sm text-amber-400">
                                        Prompt kütüphaneniz boş. Menüden &quot;Promptlar&quot; sayfasına gidip ekleyebilirsiniz.
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <select
                                                value={selectedPromptId}
                                                onChange={(e) => setSelectedPromptId(e.target.value)}
                                                disabled={loading}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 appearance-none pr-10"
                                            >
                                                <option value="" disabled>Lütfen bir prompt seçin</option>
                                                {prompts.map(prompt => (
                                                    <option key={prompt.id} value={prompt.id}>
                                                        {prompt.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Readonly preview of library prompt */}
                                        {selectedPrompt && (
                                            <div className="mt-2">
                                                <div className="text-xs text-slate-500 mb-1.5 flex justify-between">
                                                    <span>Önizleme (Salt Okunur)</span>
                                                </div>
                                                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-[13px] leading-relaxed text-slate-300 min-h-[120px] max-h-64 overflow-y-auto whitespace-pre-wrap">
                                                    {selectedPrompt.content}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-xs text-slate-500 mb-1.5">Maksimum verimlilik için detaylı ve anlaşılır bir prompt kullanın.</div>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Sen alanında uzman bir çevirmensin. Bana şu makaleyi çevir..."
                                    disabled={loading}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 min-h-[200px] resize-y"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || tools.length === 0}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'AI Çalışıyor...' : 'Run Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
