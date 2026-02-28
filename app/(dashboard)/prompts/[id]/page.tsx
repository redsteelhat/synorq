import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import CopyButton from '@/components/tasks/CopyButton';
import Link from 'next/link';
import { ArrowLeft, GitMerge, FilePlus2, CheckCircle2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { Prompt } from '@/types';

export default async function PromptDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!workspace) redirect('/dashboard');

    // 1. İlgili Promptu Çek
    const { data: currentPrompt, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', params.id)
        .eq('workspace_id', workspace.id)
        .single();

    if (error || !currentPrompt) {
        return (
            <div className="h-full flex flex-col">
                <Header title="Prompt Bulunamadı" />
                <div className="flex-1 p-8 flex flex-col items-center justify-center">
                    <p className="text-[#64748B] mb-4">Bu prompt silinmiş veya erişim izniniz yok.</p>
                    <Link href="/prompts" className="text-indigo-400 hover:underline">← Kütüphaneye Dön</Link>
                </div>
            </div>
        );
    }

    // 2. Kök Parent'ı bul ve Zinciri getir
    // Mevcut tüm promptları çek (performans açısından sadece workspace, ve name mantıklı olsa da çok yok diye hepsini alıyoruz)
    const { data: allPrompts } = await supabase
        .from('prompts')
        .select('*')
        .eq('workspace_id', workspace.id);

    const prompts = allPrompts || [];

    // Kök id bulma (En eski atayı bulana dek parent'a git)
    let rootId = currentPrompt.id;
    let curr = currentPrompt;
    let fallbackLimit = 50; // infinite loop protection

    while (curr.parent_id && fallbackLimit > 0) {
        fallbackLimit--;
        const p = prompts.find(pr => pr.id === curr.parent_id);
        if (!p) break;
        curr = p;
        rootId = curr.id;
    }

    // Bu köke bağlı olan versiyonları bul (Kendisi ve ataları rootId'ye ulaşanlar)
    const versionChain: Prompt[] = [];

    const getRoot = (pt: Prompt) => {
        let rId = pt.id;
        let c = pt;
        let lim = 50;
        while (c.parent_id && lim > 0) {
            lim--;
            const prnt = prompts.find(x => x.id === c.parent_id);
            if (!prnt) break;
            c = prnt;
            rId = c.id;
        }
        return rId;
    };

    for (const pt of prompts) {
        if (getRoot(pt) === rootId) {
            versionChain.push(pt as Prompt);
        }
    }

    // Version'a göre DESC sırala
    versionChain.sort((a, b) => b.version - a.version);

    return (
        <div className="h-full flex flex-col">
            <Header title="Prompt Detayı" />
            <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto space-y-8">

                {/* Gezinme ve Başlık Alanı */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/prompts" className="inline-flex items-center gap-1 text-sm font-medium text-[#64748B] hover:text-indigo-400 mb-2 transition-colors">
                            <ArrowLeft size={16} /> Kütüphane
                        </Link>
                        <h2 className="text-2xl font-bold text-[#F1F5F9] flex gap-3 items-center">
                            {currentPrompt.name}
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-sm font-semibold shrink-0">
                                v{currentPrompt.version}
                            </span>
                        </h2>
                        <div className="text-sm text-[#64748B] flex items-center gap-2">
                            <span>Oluşturulma: {new Date(currentPrompt.created_at).toLocaleString('tr-TR')}</span>
                            {currentPrompt.tags && currentPrompt.tags.length > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-[#1E2A3A]"></span>
                                    <div className="flex gap-1.5">
                                        {currentPrompt.tags.map((t: string) => (
                                            <span key={t} className="bg-[#1E2A3A] text-[#F1F5F9] px-2 py-0.5 rounded-md text-[11px] font-medium border border-[#2D3F55]">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href={`/prompts/new?parentId=${currentPrompt.id}`}
                            className="btn-secondary"
                        >
                            <GitMerge size={16} />
                            Yeni Versiyon
                        </Link>
                        <Link
                            href={`/tasks/new?promptId=${currentPrompt.id}`}
                            className="btn-primary"
                        >
                            <FilePlus2 size={16} />
                            Göreve Ekle
                        </Link>
                    </div>
                </div>

                {/* Prompt İçerik Kutusu */}
                <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-[#1E2A3A] flex justify-between items-center bg-[#080C14]/80">
                        <h3 className="font-semibold text-[#F1F5F9]">İçerik</h3>
                        <CopyButton text={currentPrompt.content} />
                    </div>
                    <div className="p-6 overflow-y-auto bg-[#080C14]">
                        <pre className="font-mono text-[13px] leading-relaxed text-[#F1F5F9] whitespace-pre-wrap break-words">
                            {currentPrompt.content}
                        </pre>
                    </div>
                </div>

                {/* Versiyon Geçmişi */}
                {versionChain.length > 1 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-[#F1F5F9] text-lg">
                            Versiyon Geçmişi ({versionChain.length})
                        </h3>
                        <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl overflow-hidden divide-y divide-[#1E2A3A]/50">
                            {versionChain.map((v) => {
                                const isActive = v.id === currentPrompt.id;
                                return (
                                    <div key={v.id} className={`flex items-start justify-between p-4 md:p-5 transition-colors ${isActive ? 'bg-indigo-500/5' : 'hover:bg-[#1E2A3A]/30'}`}>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 border ${isActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]'}`}>
                                                    v{v.version}
                                                </span>
                                                {isActive && (
                                                    <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-400">
                                                        <CheckCircle2 size={12} /> Şu anki
                                                    </span>
                                                )}
                                                <span className="text-xs text-[#334155] ml-auto md:ml-0">
                                                    {timeAgo(v.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-mono text-[#64748B] truncate mt-2">
                                                {v.content}
                                            </p>
                                        </div>
                                        {!isActive && (
                                            <div className="shrink-0 mt-2 md:mt-0 items-center justify-center flex">
                                                <Link
                                                    href={`/prompts/${v.id}`}
                                                    className="btn-secondary px-3 py-1.5 text-xs"
                                                >
                                                    Görüntüle
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
