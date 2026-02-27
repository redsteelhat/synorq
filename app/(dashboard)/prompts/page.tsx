import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import PromptGrid from '@/components/prompts/PromptGrid';

export default async function PromptsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    const { data: prompts, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="h-full flex flex-col">
                <Header title="Prompt Kütüphanesi" />
                <div className="flex-1 p-8 text-center text-red-400">
                    Promptlar yüklenirken hata oluştu.
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <Header title="Prompt Kütüphanesi" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mx-auto max-w-6xl mb-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">Tüm Promptlar</h2>
                        <span className="bg-slate-800 text-slate-300 font-medium px-2.5 py-0.5 rounded-full text-sm border border-slate-700">
                            {prompts?.length || 0}
                        </span>
                    </div>
                    <Link
                        href="/prompts/new"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={18} />
                        New Prompt
                    </Link>
                </div>

                <PromptGrid prompts={prompts || []} />
            </div>
        </div>
    );
}
