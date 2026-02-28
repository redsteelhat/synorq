'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Zap, BrainCircuit, Sparkles, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

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

export default function AddToolModal({ workspaceId }: { workspaceId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [provider, setProvider] = useState<string>('');
    const [model, setModel] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const [saving, setSaving] = useState(false);

    const handleProviderSelect = (provId: string) => {
        setProvider(provId);
        const prov = PROVIDERS.find(p => p.id === provId);
        if (prov) {
            setModel(prov.defaultModel);
            setDisplayName(prov.defaultName);
        }
        setTestResult('idle');
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // reset state
            setProvider('');
            setModel('');
            setDisplayName('');
            setApiKey('');
            setShowKey(false);
            setTestResult('idle');
        }
        setOpen(newOpen);
    };

    const handleTest = async () => {
        if (!provider || !model || !apiKey) {
            toast.error('Lütfen sağlayıcı, model ve API anahtarını doldurun.');
            return;
        }

        setTesting(true);
        setTestResult('idle');

        try {
            const res = await fetch('/api/tools/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, model, apiKey }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setTestResult('error');
                setTestMessage(data.error || 'Bağlantı hatası');
            } else {
                setTestResult('success');
                setTestMessage(data.message || 'Bağlantı başarılı ✓');
            }
        } catch {
            setTestResult('error');
            setTestMessage('Sunucuyla anlık bağlantı kurulamadı');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!provider || !model || !displayName || !apiKey) {
            toast.error('Tüm alanları doldurmanız gerekiyor.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/tools', {
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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Araç kaydedilemedi');
            }

            toast.success('AI Aracı başarıyla eklendi!');
            setOpen(false);
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error('Bilinmeyen bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={18} />
                    Araç Ekle
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Yeni AI Aracı Bağla</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">Servis Sağlayıcı</label>
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
                                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-800/50'
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
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Görüntülenme Adı</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                disabled={saving}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                disabled={saving}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">API Key</label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    disabled={saving}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Test & Save Actions */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={testing || saving || !provider}
                                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {testing ? <Loader2 size={16} className="animate-spin" /> : null}
                                {testing ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}
                            </button>

                            {testResult === 'success' && (
                                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                                    <CheckCircle2 size={16} />
                                    <span>{testMessage}</span>
                                </div>
                            )}
                            {testResult === 'error' && (
                                <div className="flex items-center gap-1.5 text-rose-400 text-sm font-medium max-w-[200px]">
                                    <XCircle size={16} className="shrink-0" />
                                    <span className="truncate" title={testMessage}>{testMessage}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !provider}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
