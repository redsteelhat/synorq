import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId zorunludur' }, { status: 400 });
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 403 });
        }

        const search = searchParams.get('search');

        let query = supabase
            .from('prompts')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: prompts, error } = await query;

        if (error) throw error;

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error('Prompts GET hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { workspaceId, name, content, tags, parentId } = body;

        if (!workspaceId || !name || !content) {
            return NextResponse.json(
                { error: 'workspaceId, name ve content zorunludur' },
                { status: 400 }
            );
        }

        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 403 });
        }

        // Parent varsa versiyonu artır
        let version = 1;
        if (parentId) {
            const { data: parent } = await supabase
                .from('prompts')
                .select('version')
                .eq('id', parentId)
                .single();
            if (parent) version = parent.version + 1;
        }

        const { data: prompt, error } = await supabase
            .from('prompts')
            .insert({
                workspace_id: workspaceId,
                name,
                content,
                tags: tags ?? null,
                parent_id: parentId ?? null,
                version,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ prompt }, { status: 201 });
    } catch (error) {
        console.error('Prompts POST hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
