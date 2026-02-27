import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAI } from '@/lib/ai/router';
import { decryptApiKey } from '@/lib/crypto';
import type { AIProvider } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await request.json();
        const { taskId, workspaceId } = body;

        if (!taskId || !workspaceId) {
            return NextResponse.json({ error: 'taskId ve workspaceId zorunludur' }, { status: 400 });
        }

        // Workspace sahipliğini doğrula
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspaceId)
            .eq('owner_id', user.id)
            .single();

        if (wsError || !workspace) {
            return NextResponse.json({ error: 'Workspace bulunamadı veya erişim yok' }, { status: 403 });
        }

        // Task bilgisini çek
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select(`
        *,
        ai_tools (id, name, display_name, model, api_key_encrypted),
        prompts (id, name, content)
      `)
            .eq('id', taskId)
            .eq('workspace_id', workspaceId)
            .single();

        if (taskError || !task) {
            return NextResponse.json({ error: 'Task bulunamadı' }, { status: 404 });
        }

        if (!task.ai_tools) {
            return NextResponse.json({ error: 'Task için AI araç tanımlanmamış' }, { status: 400 });
        }

        const promptContent = task.prompts?.content ?? task.custom_prompt;

        if (!promptContent) {
            return NextResponse.json({ error: 'Prompt içeriği bulunamadı' }, { status: 400 });
        }

        // Task durumunu 'running' yap
        await supabase
            .from('tasks')
            .update({ status: 'running' })
            .eq('id', taskId);

        let aiResult;
        let outputError: string | null = null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
            const apiKey = decryptApiKey(task.ai_tools.api_key_encrypted!);
            aiResult = await runAI(
                task.ai_tools.name as AIProvider,
                task.ai_tools.model!,
                apiKey,
                promptContent,
                controller.signal
            );
        } catch (aiErr) {
            outputError = aiErr instanceof Error ? aiErr.message : 'AI çağrısı başarısız';
            if (aiErr instanceof Error && aiErr.name === 'AbortError') {
                outputError = 'Zaman aşımı: AI yanıtı 30 saniye içinde alınamadı.';
            } else if (aiErr instanceof Error && aiErr.message.includes('AbortError')) {
                outputError = 'Zaman aşımı: AI yanıtı 30 saniye içinde alınamadı.';
            }
        } finally {
            clearTimeout(timeoutId);
        }

        // Output tablosuna kaydet
        const { data: output } = await supabase
            .from('outputs')
            .insert({
                task_id: taskId,
                workspace_id: workspaceId,
                content: aiResult?.content ?? null,
                input_tokens: aiResult?.inputTokens ?? 0,
                output_tokens: aiResult?.outputTokens ?? 0,
                cost_usd: aiResult?.costUsd ?? 0,
                model_used: task.ai_tools.model,
                duration_ms: aiResult?.durationMs ?? null,
                error: outputError,
            })
            .select()
            .single();

        // Task durumunu güncelle
        await supabase
            .from('tasks')
            .update({ status: outputError ? 'failed' : 'done' })
            .eq('id', taskId);

        if (outputError) {
            return NextResponse.json({ success: false, error: outputError, output }, { status: 422 });
        }

        return NextResponse.json({ success: true, output });
    } catch (error) {
        console.error('Run API hatası:', error);
        return NextResponse.json(
            { error: 'Sunucu hatası', detail: error instanceof Error ? error.message : 'Bilinmeyen hata' },
            { status: 500 }
        );
    }
}
