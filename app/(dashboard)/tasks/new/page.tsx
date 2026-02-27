import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import TaskForm from '@/components/tasks/TaskForm';

export default async function NewTaskPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    const [{ data: tools }, { data: prompts }] = await Promise.all([
        supabase
            .from('ai_tools')
            .select('id, name, display_name, model')
            .eq('workspace_id', workspace.id)
            .eq('is_active', true)
            .order('name'),
        supabase
            .from('prompts')
            .select('id, name, content')
            .eq('workspace_id', workspace.id)
            .order('name'),
    ]);

    return (
        <div className="h-full flex flex-col">
            <Header title="Yeni Görev Oluştur" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto w-full">
                    <TaskForm
                        workspaceId={workspace.id}
                        tools={tools || []}
                        prompts={prompts || []}
                    />
                </div>
            </div>
        </div>
    );
}
