'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    return (
        <div className="min-h-screen bg-[#080C14] text-[#F1F5F9] flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-[#1E2A3A] bg-[#0D1321] p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertTriangle size={28} />
                </div>
                <h1 className="text-xl font-semibold text-white">Bir şeyler ters gitti</h1>
                <p className="mt-2 text-sm text-[#64748B] break-words">
                    {error.message}
                </p>
                <button
                    type="button"
                    onClick={reset}
                    className="btn-primary mt-6"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    );
}
