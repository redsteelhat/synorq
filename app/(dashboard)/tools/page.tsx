import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import AddToolModal from '@/components/tools/AddToolModal';
import ToolCard from '@/components/tools/ToolCard';
import { Cpu } from 'lucide-react';

export default async function ToolsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    let tools: { id: string, name: 'openai' | 'anthropic' | 'google', display_name: string, model: string, is_active: boolean, key_preview?: string }[] = [];
    const absoluteApiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${absoluteApiUrl}/api/tools?workspaceId=${workspace.id}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            tools = data.tools || [];
        }
    } catch (e) {
        console.error("Tools Fetching Error in Server Component", e);
    }
    const activeCount = tools.filter((t) => t.is_active).length;

    return (
        <div className="h-full flex flex-col">
            <Header title="AI Araçlar" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mx-auto max-w-6xl mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-semibold text-[#F1F5F9]">Bağlı Araçlar</h2>
                        <span className="bg-indigo-500/10 text-indigo-400 font-medium px-2.5 py-0.5 rounded-full text-xs border border-indigo-500/20">
                            {activeCount} Aktif
                        </span>
                    </div>
                    <AddToolModal workspaceId={workspace.id} />
                </div>

                <div className="max-w-6xl mx-auto">
                    {tools.length === 0 ? (
                        <div className="empty-state flex min-h-[400px] flex-col items-center justify-center max-w-5xl mx-auto">
                            <div className="empty-state-icon">
                                <Cpu size={20} className="text-[#334155]" />
                            </div>
                            <h3 className="text-[#F1F5F9] font-medium mb-1">AI aracı bağlanmadı</h3>
                            <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto text-center">
                                OpenAI, Anthropic veya Google gibi yapay zeka araçlarını çalışma alanınıza bağlayıp otomasyonlarınıza entegre edin.
                            </p>
                            <AddToolModal workspaceId={workspace.id} triggerLabel="Araç ekle" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {tools.map((tool) => (
                                <ToolCard key={tool.id} tool={tool} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
