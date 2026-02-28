'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen bg-[#080C14] flex items-center justify-center px-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 p-[1px] mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                        <div className="h-full w-full rounded-[11px] bg-[#080C14]/40" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">Synorq&apos;a Giriş Yap</h1>
                    <p className="text-[#64748B] mt-1">AI operasyonlarını yönetmeye devam et</p>
                </div>

                {/* Form */}
                <div className="form-card rounded-2xl p-8">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="field-label">
                                E-posta
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@email.com"
                                required
                                className="field-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="field-label">
                                Şifre
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="field-input"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            id="login-submit"
                            className="btn-primary w-full py-3 font-semibold mt-2"
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-[#64748B]">
                        Hesabın yok mu?{' '}
                        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Kayıt ol
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
