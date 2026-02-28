'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Zap, BrainCircuit, Sparkles, Loader2, CheckCircle2, XCircle, Eye, EyeOff, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROVIDERS = [
    {
        id: 'openai',
        name: 'OpenAI',
        icon: Zap,
        defaultModel: 'gpt-4o',
        defaultName: 'ChatGPT',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        icon: BrainCircuit,
        defaultModel: 'claude-3-5-sonnet-20241022',
        defaultName: 'Claude',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10'
    },
    {
        id: 'google',
        name: 'Google',
        icon: Sparkles,
        defaultModel: 'gemini-1.5-pro',
        defaultName: 'Gemini',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10'
    }
];

function OnboardingWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialStep = Number(searchParams.get('step')) || 1;
    const [step, setStep] = useState<number>(initialStep >= 1 && initialStep <= 3 ? initialStep : 1);
    const [workspaceId, setWorkspaceId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Step 1 State
    const [workspaceName, setWorkspaceName] = useState('');

    // Step 2 State
    const [provider, setProvider] = useState<string>('');
    const [model, setModel] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    // Step 3 State
    const [promptName, setPromptName] = useState('');
    const [promptContent, setPromptContent] = useState('');

    useEffect(() => {
        const paramStep = Number(searchParams.get('step'));
        if (paramStep >= 1 && paramStep <= 3 && paramStep !== step) {
            setStep(paramStep);
        }
    }, [searchParams, step]);

    useEffect(() => {
        // Fetch workspace if not set (e.g. on refresh) but only on step 2/3
        if (step > 1 && !workspaceId) {
            const fetchWorkspace = async () => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('workspaces')
                        .select('id')
                        .eq('owner_id', user.id)
                        .maybeSingle();

                    if (data) {
                        setWorkspaceId(data.id);
                    } else if (step > 1) {
                        // If no workspace but we are on step > 1, go back to step 1
                        updateStep(1);
                    }
                }
            };
            fetchWorkspace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, workspaceId, router]);

    const updateStep = (newStep: number) => {
        router.push(`/onboarding?step=${newStep}`);
        setStep(newStep);
    };

    // Form Handlers
    const handleWorkspaceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (workspaceName.trim().length < 2) {
            toast.error("Workspace adı en az 2 karakter olmalıdır.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/workspace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workspaceName })
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    // Check our workspace id so we can just move past it
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: extData } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).maybeSingle();
                        if (extData) {
                            setWorkspaceId(extData.id);
                            updateStep(2);
                            return;
                        }
                    }
                }
                throw new Error(data.error || 'Oluşturulamadı');
            }

            setWorkspaceId(data.workspace.id);
            toast.success("Workspace oluşturuldu!");
            updateStep(2);
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderSelect = (provId: string) => {
        setProvider(provId);
        const prov = PROVIDERS.find(p => p.id === provId);
        if (prov) {
            setModel(prov.defaultModel);
            setDisplayName(prov.defaultName);
        }
        setTestResult('idle');
    };

    const handleToolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || !model || !apiKey) {
            toast.error('Lütfen sağlayıcı, model ve API anahtarını doldurun.');
            return;
        }

        setTesting(true);
        setTestResult('idle');

        try {
            // 1. Test
            const testRes = await fetch('/api/tools/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, model, apiKey }),
            });

            const testData = await testRes.json();
            if (!testRes.ok || !testData.success) {
                setTestResult('error');
                setTestMessage(testData.error || 'Bağlantı hatası');
                toast.error(testData.error || 'Bağlantı hatası. Bilgilerinizi kontrol ediniz.');
                setTesting(false);
                return;
            }

            // 2. Save
            const saveRes = await fetch('/api/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    name: provider,
                    model,
                    displayName,
                    apiKey
                }),
            });

            if (!saveRes.ok) throw new Error('Araç kaydedilemedi');

            toast.success('AI Aracı başarıyla bağlandı!');
            updateStep(3);
        } catch {
            setTestResult('error');
            setTestMessage('Sunucuyla bağlantı kurulamadı');
            toast.error('Kayıt işlemi başarısız oldu.');
        } finally {
            setTesting(false);
        }
    };

    const handlePromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptName || !promptContent) {
            toast.error('Lütfen isim ve içerik alanlarını doldurun.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    name: promptName,
                    content: promptContent,
                }),
            });

            if (!res.ok) throw new Error('Prompt kaydedilemedi');

            toast.success("Hazırsın! Dashboard'a yönlendiriliyorsun...", { duration: 3000 });
            router.push('/dashboard');
        } catch {
            toast.error('Prompt kaydedilirken hata oluştu.');
            setLoading(false);
        }
    };

    const skipToDashboard = () => {
        router.push('/dashboard');
    };

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-500 ease-in-out" style={{ width: `${((step - 1) / 2) * 100}%` }} />

                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                            step > i ? "bg-indigo-600 text-white" : step === i ? "bg-slate-900 border-2 border-indigo-500 text-indigo-400" : "bg-slate-900 border-2 border-slate-700 text-slate-500"
                        )}
                    >
                        {step > i ? <CheckCircle2 size={18} /> : i}
                    </div>
                ))}
            </div>

            {/* Step 1: Workspace */}
            <div className={cn("transition-all duration-500", step === 1 ? "opacity-100 translate-x-0" : "opacity-0 hidden")}>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Synorq&apos;a hoş geldin! 👋</h2>
                    <p className="text-slate-400">Önce workspace&apos;ini (çalışma alanını) oluşturalım.</p>
                </div>
                <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Building2 size={16} /> Çalışma Alanı Adı
                        </label>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={e => setWorkspaceName(e.target.value)}
                            placeholder="Örn: My Agency, Personal..."
                            required
                            minLength={2}
                            autoFocus
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || workspaceName.trim().length < 2}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        Devam Et
                    </button>
                </form>
            </div>

            {/* Step 2: Tool */}
            <div className={cn("transition-all duration-500", step === 2 ? "opacity-100 translate-x-0" : "opacity-0 hidden")}>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">AI aracını bağla</h2>
                    <p className="text-slate-400">ChatGPT, Claude veya Gemini ile başla.</p>
                </div>
                <form onSubmit={handleToolSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                        {PROVIDERS.map((p) => {
                            const Icon = p.icon;
                            const isSelected = provider === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleProviderSelect(p.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${p.bg} ${p.color} mb-2`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-200">{p.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{p.defaultName}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", provider ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">API Key</label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-4 pr-10 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="sk-..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {testResult === 'error' && (
                            <div className="flex items-center gap-1.5 text-rose-400 text-sm font-medium">
                                <XCircle size={14} className="shrink-0" />
                                <span>{testMessage}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={testing || !provider || !apiKey}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {testing ? <Loader2 size={18} className="animate-spin" /> : null}
                            {testing ? "Test ediliyor..." : "Test Et ve Kaydet"}
                        </button>
                        <button
                            type="button"
                            onClick={() => updateStep(3)}
                            className="text-sm text-slate-500 hover:text-slate-300 font-medium self-end transition-colors"
                        >
                            Şimdilik Atla →
                        </button>
                    </div>
                </form>
            </div>

            {/* Step 3: Prompt */}
            <div className={cn("transition-all duration-500", step === 3 ? "opacity-100 translate-x-0" : "opacity-0 hidden")}>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Bir prompt şablonu kaydet</h2>
                    <p className="text-slate-400">Aynı promptu tekrar tekrar yazmak zorunda kalma.</p>
                </div>
                <form onSubmit={handlePromptSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">İsim</label>
                        <input
                            type="text"
                            value={promptName}
                            onChange={e => setPromptName(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Örn: Blog Post Editor"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Prompt İçeriği</label>
                        <textarea
                            value={promptContent}
                            onChange={e => setPromptContent(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 min-h-32 resize-y transition-colors"
                            placeholder="Aşağıdaki metni SEO kurallarına uygun olarak düzenle..."
                        />
                    </div>
                    <div className="flex flex-col gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading || !promptName || !promptContent}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Kaydet ve Başla
                        </button>
                        <button
                            type="button"
                            onClick={skipToDashboard}
                            className="text-sm text-slate-500 hover:text-slate-300 font-medium self-end transition-colors"
                        >
                            Atla, Dashboard&apos;a Geç →
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="flex flex-col items-center justify-center p-12 text-slate-400"><Loader2 className="animate-spin mb-4" size={32} />Yükleniyor...</div>}>
            <OnboardingWizard />
        </Suspense>
    );
}
