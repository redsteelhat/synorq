import { type SupabaseClient } from '@supabase/supabase-js';
import { type Workspace } from '@/types';

export async function getUserWorkspace(supabase: SupabaseClient): Promise<Workspace | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Workspace;
}
