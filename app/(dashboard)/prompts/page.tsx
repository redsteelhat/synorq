import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
import { Plus } from 'lucide-react';
import type { Prompt } from '@/types';

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

    const { data: prompts } = await supabase
        .from('prompts')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

    return (
        <div>
            <Header title="Promptlar" />
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-white text-2xl font-bold">Prompt Kütüphanesi</h2>
                        <p className="text-slate-400 mt-1">{prompts?.length ?? 0} prompt</p>
                    </div>
                    <Link
                        href="/prompts/new"
                        id="new-prompt-btn"
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    >
                        <Plus size={16} />
                        Yeni Prompt
                    </Link>
                </div>

                {!prompts || prompts.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
                        <p className="text-slate-400 mb-4">Henüz prompt yok.</p>
                        <Link href="/prompts/new" className="text-purple-400 hover:text-purple-300 text-sm">
                            İlk promptu oluştur →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {prompts.map((prompt: Prompt) => (
                            <div
                                key={prompt.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-white font-medium">{prompt.name}</h3>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            v{prompt.version} • {new Date(prompt.created_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    {prompt.tags && prompt.tags.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {prompt.tags.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="bg-purple-900/30 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-700/30"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-slate-400 text-sm line-clamp-3">{prompt.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
