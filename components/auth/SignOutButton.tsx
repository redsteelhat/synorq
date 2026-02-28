'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function SignOutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="btn-secondary btn-destructive px-3 py-1.5 disabled:opacity-50"
        >
            <LogOut size={16} /> Çıkış
        </button>
    );
}
