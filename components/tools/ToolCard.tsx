'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Key } from 'lucide-react';
import type { AITool } from '@/types';

// Extended type since we added key_preview
type ToolPreview = Pick<AITool, 'id' | 'name' | 'display_name' | 'model' | 'is_active'> & { key_preview?: string };

export default function ToolCard({ tool }: { tool: ToolPreview }) {
    const router = useRouter();
    const [isActive, setIsActive] = useState(tool.is_active);
    const [loading, setLoading] = useState(false);

    let emoji = '⚙️';
    let brand: string = tool.name;

    if (tool.name === 'openai') {
        emoji = '⚡'; brand = 'OpenAI';
    } else if (tool.name === 'anthropic') {
        emoji = '🧠'; brand = 'Anthropic';
    } else if (tool.name === 'google') {
        emoji = '✨'; brand = 'Google';
    }

    const toggleActive = async () => {
        setLoading(true);
        const newState = !isActive;
        setIsActive(newState); // optimistic update

        try {
            const res = await fetch(`/api/tools/${tool.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newState }),
            });

            if (!res.ok) throw new Error();
            toast.success(`${tool.display_name} ${newState ? 'aktifleştirildi' : 'devre dışı bırakıldı'}.`);
            router.refresh();
        } catch {
            setIsActive(!newState); // revert
            toast.error('Araç durumu güncellenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`${tool.display_name} aracını silmek istediğinize emin misiniz?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tools/${tool.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error();
            toast.success('Araç silindi.');
            router.refresh();
        } catch {
            toast.error('Araç silinirken bir hata oluştu.');
            setLoading(false);
        }
    };

    return (
        <div className={`bg-slate-900 border ${isActive ? 'border-indigo-500/30' : 'border-slate-800'} rounded-xl p-5 shadow-sm transition-all flex flex-col gap-4 relative overflow-hidden group`}>

            <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center bg-slate-950 px-2 py-1 rounded-md border border-slate-800 w-fit">
                    <span className="text-sm" title={brand}>{emoji}</span>
                    <span className="text-xs font-medium text-slate-300">{brand}</span>
                </div>

                {/* Active Toggle */}
                <button
                    onClick={toggleActive}
                    disabled={loading}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isActive ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            <div className="space-y-1">
                <h3 className={`text-lg font-bold ${isActive ? 'text-white' : 'text-slate-400'} transition-colors`}>{tool.display_name}</h3>
                <p className="text-sm font-mono text-slate-500">{tool.model}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Key size={14} className="opacity-70" />
                    <span>{tool.key_preview || '••••••••HATA'}</span>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors disabled:opacity-50"
                    title="Aracı Sil"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
