'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AITool, Prompt } from '@/types';

export default function NewTaskPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [toolId, setToolId] = useState('');
    const [promptId, setPromptId] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [tools, setTools] = useState<AITool[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [workspaceId, setWorkspaceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: ws } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!ws) return;
            setWorkspaceId(ws.id);

            const [toolsRes, promptsRes] = await Promise.all([
                fetch(`/api/tools?workspaceId=${ws.id}`),
                fetch(`/api/prompts?workspaceId=${ws.id}`),
            ]);

            if (toolsRes.ok) setTools((await toolsRes.json()).tools ?? []);
            if (promptsRes.ok) setPrompts((await promptsRes.json()).prompts ?? []);
        }

        loadData();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    title,
                    toolId: toolId || undefined,
                    promptId: promptId || undefined,
                    customPrompt: customPrompt || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Görev oluşturulamadı');
                return;
            }

            router.push('/tasks');
        } catch {
            setError('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">Yeni Görev</h1>
                <p className="text-slate-400 mt-1">Bir AI görevi oluştur ve çalıştır</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Görev Başlığı *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="örn: Ürün açıklaması yaz"
                        required
                        id="task-title"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">AI Araç</label>
                    <select
                        value={toolId}
                        onChange={(e) => setToolId(e.target.value)}
                        id="task-tool"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                        <option value="">Araç seç (opsiyonel)</option>
                        {tools.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.display_name} ({t.model})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prompt Kütüphanesi</label>
                    <select
                        value={promptId}
                        onChange={(e) => setPromptId(e.target.value)}
                        id="task-prompt"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                        <option value="">Prompt seç (opsiyonel)</option>
                        {prompts.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (v{p.version})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Özel Prompt
                        <span className="text-slate-500 ml-2 font-normal">(kütüphaneden seçmediyseniz)</span>
                    </label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Promptunuzu buraya yazın..."
                        rows={5}
                        id="task-custom-prompt"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        id="create-task-submit"
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
                    >
                        {loading ? 'Oluşturuluyor...' : 'Görevi Oluştur'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-6 py-2.5 rounded-lg transition-all"
                    >
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
}
