'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

const PROVIDER_OPTIONS = [
    { name: 'openai', displayName: 'ChatGPT (OpenAI)', models: ['gpt-4o', 'gpt-4o-mini'] },
    { name: 'anthropic', displayName: 'Claude (Anthropic)', models: ['claude-3-5-sonnet-20241022'] },
    { name: 'google', displayName: 'Gemini (Google)', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
];

interface AddToolCardProps {
    workspaceId: string;
}

export default function AddToolCard({ workspaceId }: AddToolCardProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [model, setModel] = useState('gpt-4o');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedProvider = PROVIDER_OPTIONS.find((p) => p.name === provider)!;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    name: provider,
                    displayName: selectedProvider.displayName,
                    apiKey,
                    model,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Araç eklenemedi');
                return;
            }

            setOpen(false);
            setApiKey('');
            router.refresh();
        } catch {
            setError('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                id="add-tool-btn"
                className="border-2 border-dashed border-[#1E2A3A] hover:border-indigo-500/40 text-[#64748B] hover:text-[#F1F5F9] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[180px] bg-[#080C14]/50"
            >
                <div className="w-10 h-10 rounded-xl bg-[#0D1321] border border-[#1E2A3A] flex items-center justify-center">
                    <Plus size={20} />
                </div>
                <span className="text-sm font-medium">AI Araç Ekle</span>
            </button>
        );
    }

    return (
        <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Yeni AI Araç</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="field-label">Sağlayıcı</label>
                    <select
                        value={provider}
                        onChange={(e) => {
                            setProvider(e.target.value);
                            setModel(PROVIDER_OPTIONS.find((p) => p.name === e.target.value)!.models[0]);
                        }}
                        id="tool-provider"
                        className="field-select px-3 py-2"
                    >
                        {PROVIDER_OPTIONS.map((p) => (
                            <option key={p.name} value={p.name}>{p.displayName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="field-label">Model</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        id="tool-model"
                        className="field-select px-3 py-2 font-mono"
                    >
                        {selectedProvider.models.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="field-label">API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        required
                        id="tool-api-key"
                        className="field-input px-3 py-2 font-mono"
                    />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="flex gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 py-2"
                    >
                        {loading ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="btn-secondary px-3 py-2"
                    >
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
}
