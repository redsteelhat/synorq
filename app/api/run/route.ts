import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAI } from '@/lib/ai/router';
import { decryptApiKey } from '@/lib/crypto';
import type { AIProvider } from '@/types';
import { evaluateRunGuard, type WorkspacePlan, type SubscriptionStatus } from '@/lib/billing';

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
            .select('id, plan, subscription_status')
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

        const aiTool = Array.isArray(task.ai_tools) ? task.ai_tools[0] : task.ai_tools;

        if (!aiTool) {
            return NextResponse.json({ error: 'Task için AI araç tanımlanmamış' }, { status: 400 });
        }

        const promptContent = task.prompts?.content ?? task.custom_prompt;

        if (!promptContent) {
            return NextResponse.json({ error: 'Prompt içeriği bulunamadı' }, { status: 400 });
        }

        const runGuard = await evaluateRunGuard({
            supabase,
            workspace: {
                id: workspace.id,
                plan: workspace.plan as WorkspacePlan,
                subscription_status: workspace.subscription_status as SubscriptionStatus,
            },
            taskId,
            toolId: aiTool.id ?? null,
            clientTag: task.client_tag ?? null,
            projectTag: task.project_tag ?? null,
        });

        if (!runGuard.allowed) {
            await supabase
                .from('tasks')
                .update({ status: 'failed' })
                .eq('id', taskId);

            return NextResponse.json(
                {
                    error: runGuard.message,
                    code: runGuard.code,
                    usage: runGuard.usage,
                    warnings: runGuard.warnings,
                    upgradeCtaUrl: runGuard.upgradeCtaUrl,
                },
                { status: runGuard.status }
            );
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
            const apiKey = decryptApiKey(aiTool.api_key_encrypted!);
            aiResult = await runAI(
                aiTool.name as AIProvider,
                aiTool.model!,
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
                model_used: aiTool.model,
                duration_ms: aiResult?.durationMs ?? null,
                error: outputError,
                client_tag: task.client_tag ?? null,
                project_tag: task.project_tag ?? null,
            })
            .select()
            .single();

        // Task durumunu güncelle
        await supabase
            .from('tasks')
            .update({ status: outputError ? 'failed' : 'done' })
            .eq('id', taskId);

        if (outputError) {
            return NextResponse.json(
                {
                    success: false,
                    error: outputError,
                    output,
                    usageWarnings: runGuard.warnings,
                },
                { status: 422 }
            );
        }

        return NextResponse.json({ success: true, output, usageWarnings: runGuard.warnings });
    } catch (error) {
        console.error('Run API hatası:', error);
        return NextResponse.json(
            { error: 'Sunucu hatası', detail: error instanceof Error ? error.message : 'Bilinmeyen hata' },
            { status: 500 }
        );
    }
}
