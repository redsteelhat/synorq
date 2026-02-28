'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Key } from 'lucide-react';
import type { AITool } from '@/types';

type ToolPreview = Pick<AITool, 'id' | 'name' | 'display_name' | 'model' | 'is_active'> & { key_preview?: string };

const providerConfig = {
    openai: {
        monogram: 'OA',
        brand: 'OpenAI',
        iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20',
        glowColor: 'bg-green-400',
    },
    anthropic: {
        monogram: 'AN',
        brand: 'Anthropic',
        iconBg: 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20',
        glowColor: 'bg-orange-400',
    },
    google: {
        monogram: 'GG',
        brand: 'Google',
        iconBg: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20',
        glowColor: 'bg-blue-400',
    },
} as const;

export default function ToolCard({ tool }: { tool: ToolPreview }) {
    const router = useRouter();
    const [isActive, setIsActive] = useState(tool.is_active);
    const [loading, setLoading] = useState(false);

    const config = providerConfig[tool.name as keyof typeof providerConfig] || {
        monogram: 'AI',
        brand: tool.name,
        iconBg: 'bg-gradient-to-br from-[#334155]/40 to-[#334155]/20 border border-[#334155]',
        glowColor: 'bg-[#64748B]',
    };

    const toggleActive = async () => {
        setLoading(true);
        const newState = !isActive;
        setIsActive(newState);

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
            setIsActive(!newState);
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

    const keyPreview = tool.key_preview || '••••••••';

    return (
        <div className={`group micro-lift animate-fade-scale bg-[#0D1321] border ${isActive ? 'border-[#6366F130]' : 'border-[#1E2A3A]'} hover:border-[#6366F130] rounded-xl p-5 transition-all duration-200 flex flex-col gap-4 relative overflow-hidden`}>
            {/* Decorative glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 transition-opacity duration-300 group-hover:opacity-10 ${config.glowColor}`} />

            <div className="flex justify-between items-start relative">
                <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                    <span className="font-mono text-xs font-semibold tracking-widest text-[#F1F5F9]">{config.monogram}</span>
                </div>

                <button
                    onClick={toggleActive}
                    disabled={loading}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0D1321] ${isActive ? 'bg-indigo-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#1E2A3A]'}`}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-3.5' : 'translate-x-0'}`}
                    />
                </button>
            </div>

            <div className="space-y-1.5 relative">
                <h3 className={`text-lg font-bold ${isActive ? 'text-[#F1F5F9]' : 'text-[#64748B]'} transition-colors`}>{tool.display_name}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#64748B]">{config.brand}</span>
                    <span className="bg-[#1E2A3A] text-[#64748B] text-[10px] rounded-full px-2 py-0.5 font-mono uppercase">{tool.model}</span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[#1E2A3A] flex items-center justify-between relative">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Key size={14} className="text-[#334155]" />
                    <span className="text-[#334155]">{'••••••••'}</span>
                    <span className="text-[#64748B]">{keyPreview.slice(-4)}</span>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-1.5 text-[#64748B] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-150 disabled:opacity-50"
                    title="Aracı Sil"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
