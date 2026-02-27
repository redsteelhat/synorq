'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Prompt } from '@/types';

export default function PromptGrid({ prompts }: { prompts: Prompt[] }) {
    const [search, setSearch] = useState('');

    // Grouping logic for versions: Keep the latest version per chain.
    const latestPrompts = useMemo(() => {
        const chains = new Map<string, Prompt>();

        for (const pt of prompts) {
            // Identifier for the chain is its root ID. If it has no parent, it is the root.
            // If it has a parent, let's assume parent_id points to the immediate parent or the root?
            // "eğer parent_id varsa parent_id'yi takip et (en üste çık)"
            // Well, simple approach for chains:
            // Since a prompt can have continuous parents, we need to find root.
            // Let's pre-calculate root for each prompt.
            let current = pt;
            let rootId = pt.id;

            // To prevent infinite loops just in case, use a Set
            const visited = new Set<string>();
            while (current.parent_id) {
                if (visited.has(current.parent_id)) break;
                visited.add(current.parent_id);
                const parent = prompts.find(p => p.id === current.parent_id);
                if (!parent) break; // if parent is deleted, just use current parent_id
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
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-5xl mx-auto shadow-sm min-h-[400px]">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <FileText size={32} />
                </div>
                <h3 className="text-white font-medium mb-2">Henüz prompt yok</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                    Sık kullandığınız yapay zeka komutlarını buraya ekleyerek görevlerinizde hızlıca kullanabilirsiniz.
                </p>
                <Link
                    href="/prompts/new"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon />
                    İlk promptunu oluştur
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                <input
                    type="text"
                    placeholder="İsme göre ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Aranan kritere uygun prompt bulunamadı.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(prompt => (
                        <Link key={prompt.id} href={`/prompts/${prompt.id}`} className="group relative bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col gap-3 transition-all">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                                    {prompt.name}
                                </h3>
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0">
                                    v{prompt.version}
                                </span>
                            </div>

                            <p className="text-sm font-mono text-slate-400 leading-relaxed max-h-16 overflow-hidden relative">
                                {prompt.content.slice(0, 120)}
                                {prompt.content.length > 120 && '...'}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="flex items-center gap-2 overflow-hidden flex-wrap max-h-6">
                                    {prompt.tags?.map((tag, i) => (
                                        <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-500 shrink-0">
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

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
