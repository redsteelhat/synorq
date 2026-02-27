'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Workspace } from '@/types';

export function useWorkspace() {
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWorkspace() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('Kullanıcı bulunamadı');
                    return;
                }

                const { data, error: dbError } = await supabase
                    .from('workspaces')
                    .select('*')
                    .eq('owner_id', user.id)
                    .single();

                if (dbError) throw dbError;
                setWorkspace(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Workspace yüklenemedi');
            } finally {
                setLoading(false);
            }
        }

        fetchWorkspace();
    }, []);

    return { workspace, loading, error };
}
