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

        // Workspace sahipliği kontrolü (RLS bunu zaten yapıyor ama ekstra güvenlik)
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 403 });
        }

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
        *,
        ai_tools (id, name, display_name, model),
        prompts (id, name),
        outputs (id, content, cost_usd, duration_ms, model_used, error, created_at)
      `)
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Tasks GET hatası:', error);
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
        const { workspaceId, title, toolId, promptId, customPrompt, clientTag, projectTag } = body;

        if (!workspaceId || !title) {
            return NextResponse.json({ error: 'workspaceId ve title zorunludur' }, { status: 400 });
        }

        if (!promptId && !customPrompt) {
            return NextResponse.json({ error: 'promptId veya customPrompt gerekli' }, { status: 400 });
        }

        // Workspace sahipliği kontrolü
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı' }, { status: 403 });
        }

        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                workspace_id: workspaceId,
                title,
                tool_id: toolId ?? null,
                prompt_id: promptId ?? null,
                custom_prompt: customPrompt ?? null,
                client_tag: clientTag?.trim() || null,
                project_tag: projectTag?.trim() || null,
                created_by: user.id,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('Tasks POST hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
