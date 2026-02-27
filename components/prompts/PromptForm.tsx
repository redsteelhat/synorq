'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PromptFormProps {
    workspaceId: string;
    initialValues?: {
        name: string;
        content: string;
        parentId?: string;
    };
}

export default function PromptForm({ workspaceId, initialValues }: PromptFormProps) {
    const router = useRouter();
    const [name, setName] = useState(initialValues?.name || '');
    const [content, setContent] = useState(initialValues?.content || '');
    const [tagsInput, setTagsInput] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Lütfen bir prompt adı girin.');
            return;
        }

        if (!content.trim()) {
            toast.error('Lütfen prompt içeriğini girin.');
            return;
        }

        const tags = tagsInput.trim()
            ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
            : undefined;

        setLoading(true);

        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    name,
                    content,
                    tags,
                    parentId: initialValues?.parentId,
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Prompt kaydedilemedi.');
            }

            toast.success('Prompt başarıyla kaydedildi!');
            router.push('/prompts');
            router.refresh();

        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                toast.error(error.message || 'Bilinmeyen bir hata oluştu');
            } else {
                toast.error('Bilinmeyen bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-6">
                {initialValues?.parentId ? 'Yeni Versiyon Oluştur' : 'Yeni Prompt'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">Prompt İsmi <span className="text-rose-400">*</span></label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: SEO Blog Yazarı"
                        disabled={loading}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium text-slate-300">İçerik <span className="text-rose-400">*</span></label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Sen deneyimli bir SEO blog yazarısın..."
                        disabled={loading}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 min-h-[192px] resize-y"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="tags" className="block text-sm font-medium text-slate-300">Etiketler</label>
                    <input
                        id="tags"
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="virgülle ayır: seo, blog, email"
                        disabled={loading}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    />
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                    <Link
                        href="/prompts"
                        className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
