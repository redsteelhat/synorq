import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: 'Geçersiz workspace adı' }, { status: 400 });
        }

        // Check duplicate
        const { data: existingWorkspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();

        if (existingWorkspace) {
            return NextResponse.json({ error: 'Workspace zaten mevcut' }, { status: 409 });
        }

        // Insert new workspace
        const { data: newWorkspace, error: insertError } = await supabase
            .from('workspaces')
            .insert({
                owner_id: user.id,
                name: name.trim(),
                plan: 'free',
                subscription_status: 'inactive',
            })
            .select('*')
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ workspace: newWorkspace }, { status: 201 });
    } catch (error) {
        console.error('Workspace POST error:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
