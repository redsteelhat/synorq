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

    // Sunucu tarafında key decrypt işlemini yapacak GET Endpoint logic'i benzeri bir map
    // (Güncellemeler yapıldıktan sonra Next.js route mantığı üzerinden API çağrısı da yapılabilir ama
    // Direkt supabase kullanarak ve lib/crypto decryptApiKey methodunu import ederek de çözebiliriz.
    // Ancak en pratik yol fetch /api/tools?workspaceId=... çağırmaktır fakat server component'lerde host problemi olabileceği için
    // Data getirmeyi kendi route üzerinden veya doğrudan fonksiyonel olarak çözeceğiz. 

    // Tools Fetch (Server-Side)
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
                        <h2 className="text-2xl font-bold text-white">Bağlı Araçlar</h2>
                        <span className="bg-indigo-500/10 text-indigo-400 font-medium px-2.5 py-0.5 rounded-full text-sm border border-indigo-500/20">
                            {activeCount} Aktif
                        </span>
                    </div>
                    <AddToolModal workspaceId={workspace.id} />
                </div>

                <div className="max-w-6xl mx-auto">
                    {tools.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-5xl mx-auto shadow-sm min-h-[400px]">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <Cpu size={32} />
                            </div>
                            <h3 className="text-white font-medium mb-2">Henüz araç bağlanmadı</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-sm">
                                OpenAI, Anthropic veya Google gibi yapay zeka araçlarını çalışma alanınıza bağlayıp otomasyonlarınıza entegre edin.
                            </p>
                            <AddToolModal workspaceId={workspace.id} />
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
