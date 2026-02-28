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
        <div className="form-card">
            <h2 className="text-xl font-semibold text-[#F1F5F9] mb-6">
                {initialValues?.parentId ? 'Yeni Versiyon Oluştur' : 'Yeni Prompt'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-1.5">
                    <label htmlFor="name" className="field-label">Prompt İsmi <span className="text-red-400">*</span></label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: SEO Blog Yazarı"
                        disabled={loading}
                        className="field-input"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="content" className="field-label">İçerik <span className="text-red-400">*</span></label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Sen deneyimli bir SEO blog yazarısın..."
                        disabled={loading}
                        className="field-textarea min-h-[192px] resize-y text-[13px] leading-relaxed"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="tags" className="field-label">Etiketler</label>
                    <input
                        id="tags"
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="virgülle ayır: seo, blog, email"
                        disabled={loading}
                        className="field-input"
                    />
                </div>

                <div className="pt-4 border-t border-[#1E2A3A] flex items-center justify-end gap-3">
                    <Link
                        href="/prompts"
                        className="btn-secondary"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-6"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
