'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText, Plus } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Prompt } from '@/types';

export default function PromptGrid({ prompts }: { prompts: Prompt[] }) {
    const [search, setSearch] = useState('');

    const latestPrompts = useMemo(() => {
        const chains = new Map<string, Prompt>();

        for (const pt of prompts) {
            let current = pt;
            let rootId = pt.id;

            const visited = new Set<string>();
            while (current.parent_id) {
                if (visited.has(current.parent_id)) break;
                visited.add(current.parent_id);
                const parent = prompts.find(p => p.id === current.parent_id);
                if (!parent) break;
                current = parent;
                rootId = current.id;
            }

            const existing = chains.get(rootId);
            if (!existing || pt.version > existing.version) {
                chains.set(rootId, pt);
            }
        }

        return Array.from(chains.values());
    }, [prompts]);

    const filtered = useMemo(() => {
        if (!search.trim()) return latestPrompts;
        const s = search.toLowerCase();
        return latestPrompts.filter(p => p.name.toLowerCase().includes(s));
    }, [latestPrompts, search]);

    if (prompts.length === 0) {
        return (
            <div className="empty-state flex min-h-[400px] flex-col items-center justify-center max-w-5xl mx-auto">
                <div className="empty-state-icon">
                    <FileText size={20} className="text-[#334155]" />
                </div>
                <h3 className="text-[#F1F5F9] font-medium mb-1">Prompt kütüphanesi boş</h3>
                <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto text-center">
                    Sık kullandığınız yapay zeka komutlarını buraya ekleyerek görevlerinizde hızlıca kullanabilirsiniz.
                </p>
                <Link
                    href="/prompts/new"
                    className="btn-primary px-5"
                >
                    <Plus size={16} />
                    İlk promptunu ekle
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#334155] pointer-events-none" size={18} />
                <input
                    type="text"
                    placeholder="İsme göre ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="field-input pl-10"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="p-8 text-center text-[#64748B]">Aranan kritere uygun prompt bulunamadı.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(prompt => (
                        <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="group relative micro-lift bg-[#0D1321] hover:bg-[#111827]/50 border border-[#1E2A3A] hover:border-[#6366F130] rounded-xl p-5 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-[#F1F5F9] group-hover:text-indigo-400 transition-colors truncate">
                                    {prompt.name}
                                </h3>
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0">
                                    v{prompt.version}
                                </span>
                            </div>

                            <p className="text-sm font-mono text-[#64748B] leading-relaxed max-h-16 overflow-hidden relative truncate">
                                {prompt.content.slice(0, 120)}
                                {prompt.content.length > 120 && '...'}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="flex items-center gap-2 overflow-hidden flex-wrap max-h-6">
                                    {prompt.tags?.map((tag, i) => (
                                        <span key={i} className="bg-[#1E2A3A] text-[#64748B] px-2 py-0.5 rounded text-[10px] font-medium border border-[#2D3F55]">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs text-[#334155] shrink-0">
                                    {timeAgo(prompt.created_at)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
