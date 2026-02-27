import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import ToolCard from '@/components/tools/ToolCard';
import AddToolCard from '@/components/tools/AddToolCard';
import type { AITool } from '@/types';

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

    const { data: tools } = await supabase
        .from('ai_tools')
        .select('id, workspace_id, name, display_name, model, is_active, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    return (
        <div>
            <Header title="AI Araçlar" />
            <div className="p-8">
                <div className="mb-8">
                    <h2 className="text-white text-2xl font-bold">AI Araçlar</h2>
                    <p className="text-slate-400 mt-1">Entegre ettiğiniz AI sağlayıcıları</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AddToolCard workspaceId={workspace.id} />

                    {tools?.map((tool: AITool) => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            </div>
        </div>
    );
}
