'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewPromptPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [workspaceId, setWorkspaceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadWorkspace() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: ws } = await supabase
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single();
            if (ws) setWorkspaceId(ws.id);
        }
        loadWorkspace();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const parsedTags = tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    name,
                    content,
                    tags: parsedTags.length > 0 ? parsedTags : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Prompt oluşturulamadı');
                return;
            }

            router.push('/prompts');
        } catch {
            setError('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-white text-2xl font-bold">Yeni Prompt</h1>
                <p className="text-slate-400 mt-1">Kütüphanenize yeni bir prompt ekleyin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prompt Adı *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="örn: Blog Yazısı Taslağı"
                        required
                        id="prompt-name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">İçerik *</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Prompt içeriğinizi buraya yazın..."
                        required
                        rows={8}
                        id="prompt-content"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Etiketler
                        <span className="text-slate-500 ml-2 font-normal">(virgülle ayır)</span>
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="örn: blog, pazarlama, türkçe"
                        id="prompt-tags"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
                        id="create-prompt-submit"
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-all"
                    >
                        {loading ? 'Oluşturuluyor...' : 'Prompt Oluştur'}
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
