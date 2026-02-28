'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                    <AlertTriangle size={28} />
                </div>
                <h1 className="text-xl font-semibold text-white">Bir şeyler ters gitti</h1>
                <p className="mt-2 text-sm text-slate-400 break-words">
                    {error.message}
                </p>
                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    Tekrar Dene
                </button>
            </div>
        </div>
    );
}
