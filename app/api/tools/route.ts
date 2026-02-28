import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');
        const status = searchParams.get('status') ?? 'all';

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

        let query = supabase
            .from('ai_tools')
            .select('id, workspace_id, name, display_name, model, is_active, created_at, api_key_encrypted')
            .eq('workspace_id', workspaceId);

        if (status === 'active') {
            query = query.eq('is_active', true);
        }

        const { data: tools, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        const safeTools = tools.map((tool) => {
            const { api_key_encrypted, ...rest } = tool;
            const normalized = rest as typeof rest & { active?: boolean; enabled?: boolean };
            const isActive = typeof rest.is_active === 'boolean'
                ? rest.is_active
                : Boolean(normalized.active ?? normalized.enabled);

            let keyPreview = '••••••••';
            try {
                if (api_key_encrypted) {
                    const plain = decryptApiKey(api_key_encrypted);
                    keyPreview += plain.slice(-4);
                }
            } catch {
                keyPreview += 'HATA';
            }
            return {
                ...rest,
                is_active: isActive,
                key_preview: keyPreview
            };
        });

        return NextResponse.json({ tools: safeTools, data: safeTools });
    } catch (error) {
        console.error('Tools GET hatası:', error);
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
        const { workspaceId, name, displayName, apiKey, model } = body;

        if (!workspaceId || !name || !displayName || !apiKey || !model) {
            return NextResponse.json(
                { error: 'workspaceId, name, displayName, apiKey ve model zorunludur' },
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

        const encryptedKey = encryptApiKey(apiKey);

        const { data: tool, error } = await supabase
            .from('ai_tools')
            .insert({
                workspace_id: workspaceId,
                name,
                display_name: displayName,
                api_key_encrypted: encryptedKey,
                model,
                is_active: true,
            })
            .select('id, workspace_id, name, display_name, model, is_active, created_at')
            .single();

        if (error) throw error;

        return NextResponse.json({ tool }, { status: 201 });
    } catch (error) {
        console.error('Tools POST hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
