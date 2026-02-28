'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function RunAgainButton({ taskId, workspaceId }: { taskId: string, workspaceId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleRun() {
        setLoading(true);
        toast.info('Görev yeniden çalıştırılıyor...');

        try {
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, workspaceId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Yeniden çalıştırma başarısız');
            }

            toast.success('Görev başarıyla güncellendi!');
            router.refresh(); // Server Component'i yeniden yükler
        } catch (error: unknown) {
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
        <button
            onClick={handleRun}
            disabled={loading}
            className="btn-primary px-4 py-2"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? 'Çalışıyor...' : 'Run Again'}
        </button>
    );
}
