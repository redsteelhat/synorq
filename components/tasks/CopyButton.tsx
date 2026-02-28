'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
    text: string;
    className?: string;
}

export default function CopyButton({ text, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Kopyalama başarısız', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95",
                copied
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "border border-[#1E2A3A] bg-[#0D1321] text-[#64748B] hover:border-[#2D3F55] hover:text-[#F1F5F9]",
                className
            )}
        >
            {copied ? (
                <>
                    <Check size={14} />
                    ✓ Kopyalandı
                </>
            ) : (
                <>
                    <Copy size={14} />
                    Kopyala
                </>
            )}
        </button>
    );
}
