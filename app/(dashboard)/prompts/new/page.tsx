import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import PromptForm from '@/components/prompts/PromptForm';

export default async function NewPromptPage({ searchParams }: { searchParams: { parentId?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    let initialValues = undefined;

    if (searchParams.parentId) {
        const { data: parent } = await supabase
            .from('prompts')
            .select('id, name, content')
            .eq('id', searchParams.parentId)
            .eq('workspace_id', workspace.id)
            .single();

        if (parent) {
            initialValues = {
                name: parent.name,
                content: parent.content,
                parentId: parent.id
            };
        }
    }

    const title = initialValues?.parentId ? `Yeni Versiyon: ${initialValues.name}` : "Yeni Prompt Oluştur";

    return (
        <div className="h-full flex flex-col">
            <Header title={title} />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-3xl mx-auto">
                <PromptForm
                    workspaceId={workspace.id}
                    initialValues={initialValues}
                />
            </div>
        </div>
    );
}
