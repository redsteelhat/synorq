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
    const [clientTag, setClientTag] = useState('');
    const [projectTag, setProjectTag] = useState('');
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
            const taskRes = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    title,
                    toolId,
                    promptId: promptMode === 'library' ? selectedPromptId : undefined,
                    customPrompt: promptMode === 'custom' ? customPrompt : undefined,
                    clientTag: clientTag.trim() || undefined,
                    projectTag: projectTag.trim() || undefined,
                })
            });

            if (!taskRes.ok) {
                const errData = await taskRes.json();
                throw new Error(errData.error || 'Görev oluşturulamadı');
            }

            const { task } = await taskRes.json();

            toast.info('Görev oluşturuldu, AI çalışıyor...');

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
                if (errData.upgradeCtaUrl) {
                    throw new Error(`${errData.error || 'Kullanım limitine ulaşıldı'} Planınızı yükseltin: ${errData.upgradeCtaUrl}`);
                }
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
        <div className="form-card">
            <h2 className="text-xl font-semibold text-[#F1F5F9] mb-6">Yeni Görev</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div className="space-y-1.5">
                    <label htmlFor="title" className="field-label">Başlık <span className="text-red-400">*</span></label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Örn: Pazarlama e-postası taslağı..."
                        disabled={loading}
                        className="field-input"
                    />
                </div>

                {/* AI Tool Select */}
                <div className="space-y-1.5">
                    <label htmlFor="tool" className="field-label">AI Aracı <span className="text-red-400">*</span></label>
                    {tools.length === 0 ? (
                        <div className="bg-[#0D1321] border border-amber-900/50 rounded-lg px-4 py-3 text-sm text-amber-400">
                            Workspace&apos;inizde aktif bir AI aracı bulunmuyor. Görev oluşturmak için menüden &quot;AI Araçlar&quot; sayfasına gidip bir araç ekleyin.
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                id="tool"
                                value={toolId}
                                onChange={(e) => setToolId(e.target.value)}
                                disabled={loading || tools.length === 0}
                                className="field-select"
                            >
                                <option value="" disabled>Lütfen bir AI aracı seçin</option>
                                {tools.map(tool => (
                                    <option key={tool.id} value={tool.id}>
                                        {tool.display_name} ({tool.model})
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B]">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="client-tag" className="field-label">Client Tag</label>
                        <input
                            id="client-tag"
                            type="text"
                            value={clientTag}
                            onChange={(e) => setClientTag(e.target.value)}
                            placeholder="örn: acme"
                            disabled={loading}
                            className="field-input"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="project-tag" className="field-label">Project Tag</label>
                        <input
                            id="project-tag"
                            type="text"
                            value={projectTag}
                            onChange={(e) => setProjectTag(e.target.value)}
                            placeholder="örn: q1-launch"
                            disabled={loading}
                            className="field-input"
                        />
                    </div>
                </div>

                {/* Prompt Type Toggle */}
                <div className="space-y-3">
                    <label className="field-label">Prompt Seçimi</label>
                    <div className="flex bg-[#080C14] p-1 rounded-lg border border-[#1E2A3A] w-fit">
                        <button
                            type="button"
                            onClick={() => setPromptMode('library')}
                            disabled={loading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${promptMode === 'library'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#111827]'
                                }`}
                        >
                            Kütüphaneden Seç
                        </button>
                        <button
                            type="button"
                            onClick={() => setPromptMode('custom')}
                            disabled={loading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${promptMode === 'custom'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#111827]'
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
                                    <div className="bg-[#0D1321] border border-amber-900/50 rounded-lg px-4 py-3 text-sm text-amber-400">
                                        Prompt kütüphaneniz boş. Menüden &quot;Promptlar&quot; sayfasına gidip ekleyebilirsiniz.
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <select
                                                value={selectedPromptId}
                                                onChange={(e) => setSelectedPromptId(e.target.value)}
                                                disabled={loading}
                                                className="field-select"
                                            >
                                                <option value="" disabled>Lütfen bir prompt seçin</option>
                                                {prompts.map(prompt => (
                                                    <option key={prompt.id} value={prompt.id}>
                                                        {prompt.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B]">
                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                                </svg>
                                            </div>
                                        </div>

                                        {selectedPrompt && (
                                            <div className="mt-2">
                                                <div className="text-[10px] text-[#334155] mb-1.5 uppercase tracking-wider font-medium flex justify-between">
                                                    <span>Önizleme (Salt Okunur)</span>
                                                </div>
                                                <div className="bg-[#080C14] border border-[#1E2A3A] rounded-lg p-4 font-mono text-[13px] leading-relaxed text-[#64748B] min-h-[120px] max-h-64 overflow-y-auto whitespace-pre-wrap">
                                                    {selectedPrompt.content}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="text-[10px] text-[#334155] mb-1.5 uppercase tracking-wider font-medium">Maksimum verimlilik için detaylı ve anlaşılır bir prompt kullanın.</div>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Sen alanında uzman bir çevirmensin. Bana şu makaleyi çevir..."
                                    disabled={loading}
                                    className="field-textarea min-h-[200px] text-[13px] leading-relaxed resize-y"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-[#1E2A3A] flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || tools.length === 0}
                        className="btn-primary w-full sm:w-auto px-6"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'AI Çalışıyor...' : 'Run Task'}
                    </button>
                </div>
            </form>
        </div>
    );
}
