import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        const { data: task, error } = await supabase
            .from('tasks')
            .select(`
        *,
        ai_tools (id, name, display_name, model),
        prompts (id, name, content),
        outputs (*)
      `)
            .eq('id', id)
            .single();

        if (error || !task) {
            return NextResponse.json({ error: 'Task bulunamadı' }, { status: 404 });
        }

        // RLS zaten kontrol ediyor ama çift kontrol
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', task.workspace_id)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Erişim yok' }, { status: 403 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Task GET [id] hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        
        // Ownership check
        const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id);
        const workspaceIds = workspaces?.map(w => w.id) || [];
        
        const { data: taskCheck, error: checkErr } = await supabase.from('tasks').select('workspace_id').eq('id', id).single();
        if (checkErr || !taskCheck || !workspaceIds.includes(taskCheck.workspace_id)) {
            return NextResponse.json({ error: 'Erişim yetkiniz yok veya görev bulunamadı' }, { status: 403 });
        }

        const body = await request.json();
        const { title, status } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !task) {
            return NextResponse.json({ error: 'Task güncellenemedi' }, { status: 404 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Task PATCH [id] hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;

        // Ownership check
        const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id);
        const workspaceIds = workspaces?.map(w => w.id) || [];
        
        const { data: taskCheck, error: checkErr } = await supabase.from('tasks').select('workspace_id').eq('id', id).single();
        if (checkErr || !taskCheck || !workspaceIds.includes(taskCheck.workspace_id)) {
            return NextResponse.json({ error: 'Erişim yetkiniz yok veya görev bulunamadı' }, { status: 403 });
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Task DELETE [id] hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
