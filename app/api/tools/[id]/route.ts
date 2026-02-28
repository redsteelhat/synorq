import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { is_active } = body;

        // Verify ownership
        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id);

        if (!workspaces || workspaces.length === 0) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
        }

        const workspaceIds = workspaces.map((w: { id: string }) => w.id);

        const { data: tool } = await supabase
            .from('ai_tools')
            .select('workspace_id')
            .eq('id', params.id)
            .single();

        if (!tool || !workspaceIds.includes(tool.workspace_id)) {
            return NextResponse.json({ error: 'Araç bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from('ai_tools')
            .update({ is_active })
            .eq('id', params.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('PATCH tools error', err);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id);

        if (!workspaces || workspaces.length === 0) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const workspaceIds = workspaces.map((w: { id: string }) => w.id);

        const { data: tool } = await supabase
            .from('ai_tools')
            .select('workspace_id')
            .eq('id', params.id)
            .single();

        if (!tool || !workspaceIds.includes(tool.workspace_id)) {
            return NextResponse.json({ error: 'Araç bulunamadı veya yetkiniz yok' }, { status: 404 });
        }

        const { error: deleteError } = await supabase
            .from('ai_tools')
            .delete()
            .eq('id', params.id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE tools error', e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
