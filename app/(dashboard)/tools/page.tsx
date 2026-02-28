import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import AddToolModal from '@/components/tools/AddToolModal';
import ToolCard from '@/components/tools/ToolCard';
import { Cpu } from 'lucide-react';
import { decryptApiKey } from '@/lib/crypto';
import Link from 'next/link';

type ToolRecord = {
    id: string;
    name: 'openai' | 'anthropic' | 'google';
    display_name: string;
    model: string;
    is_active: boolean;
    key_preview?: string;
};

type ToolRow = {
    id: string;
    name: 'openai' | 'anthropic' | 'google';
    display_name: string;
    model: string;
    is_active: boolean | null;
    api_key_encrypted: string | null;
};

function toToolRecord(row: ToolRow): ToolRecord {
    const legacy = row as ToolRow & { active?: boolean; enabled?: boolean };
    const isActive = typeof row.is_active === 'boolean'
        ? row.is_active
        : Boolean(legacy.active ?? legacy.enabled);

    let keyPreview = '••••••••';
    if (row.api_key_encrypted) {
        try {
            const plain = decryptApiKey(row.api_key_encrypted);
            keyPreview = `••••••••${plain.slice(-4)}`;
        } catch {
            keyPreview = '••••••••';
        }
    }

    return {
        id: row.id,
        name: row.name,
        display_name: row.display_name,
        model: row.model,
        is_active: isActive,
        key_preview: keyPreview,
    };
}

export default async function ToolsPage({
    searchParams,
}: {
    searchParams?: { filter?: string };
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    const selectedFilter = searchParams?.filter === 'all' ? 'all' : 'active';

    const { data: rows, error: toolsError } = await supabase
        .from('ai_tools')
        .select('id, name, display_name, model, is_active, api_key_encrypted, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    if (toolsError) {
        console.error('Tools query failed:', toolsError);
    }

    const tools = (rows ?? []).map((row) => toToolRecord(row as ToolRow));

    if (process.env.NODE_ENV !== 'production' && tools.some((tool) => typeof tool.is_active !== 'boolean')) {
        console.warn('[tools] is_active field normalization fallback triggered.');
    }

    const activeTools = tools.filter((tool) => tool.is_active);
    const visibleTools = selectedFilter === 'active' ? activeTools : tools;
    const activeCount = activeTools.length;
    const totalCount = tools.length;

    return (
        <div className="h-full flex flex-col">
            <Header title="AI Araçlar" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mx-auto max-w-6xl mb-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-semibold text-[#F1F5F9]">Bağlı Araçlar</h2>
                            <span className="bg-indigo-500/10 text-indigo-400 font-medium px-2.5 py-0.5 rounded-full text-xs border border-indigo-500/20">
                                {activeCount} Aktif
                            </span>
                        </div>
                        <div className="inline-flex w-fit rounded-lg border border-[#1E2A3A] bg-[#0D1321] p-1">
                            <Link
                                href="/tools?filter=active"
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${selectedFilter === 'active'
                                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                                    : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#111827]'
                                    }`}
                            >
                                Aktif ({activeCount})
                            </Link>
                            <Link
                                href="/tools?filter=all"
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${selectedFilter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                                    : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#111827]'
                                    }`}
                            >
                                Tümü ({totalCount})
                            </Link>
                        </div>
                    </div>
                    <AddToolModal workspaceId={workspace.id} />
                </div>

                <div className="max-w-6xl mx-auto">
                    {visibleTools.length === 0 ? (
                        <div className="empty-state flex min-h-[400px] flex-col items-center justify-center max-w-5xl mx-auto">
                            <div className="empty-state-icon">
                                <Cpu size={20} className="text-[#334155]" />
                            </div>
                            {totalCount === 0 ? (
                                <>
                                    <h3 className="text-[#F1F5F9] font-medium mb-1">AI aracı bağlanmadı</h3>
                                    <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto text-center">
                                        OpenAI, Anthropic veya Google gibi yapay zeka araçlarını çalışma alanınıza bağlayıp otomasyonlarınıza entegre edin.
                                    </p>
                                    <AddToolModal workspaceId={workspace.id} triggerLabel="Araç ekle" />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-[#F1F5F9] font-medium mb-1">Aktif AI aracı bulunamadı</h3>
                                    <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto text-center">
                                        Araçlar kayıtlı ancak aktif değil. Tüm araçları görüntüleyip birini aktifleştirebilirsiniz.
                                    </p>
                                    <Link href="/tools?filter=all" className="btn-secondary">
                                        Tüm Araçları Göster
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {visibleTools.map((tool) => (
                                <ToolCard key={tool.id} tool={tool} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
