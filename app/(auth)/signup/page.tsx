'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (data.user && !data.user.email_confirmed_at) {
                setSuccess(true);
                return;
            }

            router.push('/onboarding?step=1');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <main className="relative min-h-screen bg-[#080C14] flex items-center justify-center px-4 overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                </div>
                <div className="w-full max-w-md text-center">
                    <div className="form-card rounded-2xl p-8 relative">
                        <div className="text-4xl mb-4">📧</div>
                        <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">E-postanı doğrula</h2>
                        <p className="text-[#64748B]">
                            <strong className="text-[#F1F5F9]">{email}</strong> adresine doğrulama bağlantısı gönderdik.
                            E-postanı kontrol et ve hesabını aktive et.
                        </p>
                        <Link href="/login" className="block mt-6 text-indigo-400 hover:text-indigo-300 text-sm">
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-[#080C14] flex items-center justify-center px-4 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            <div className="w-full max-w-md relative">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 p-[1px] mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                        <div className="h-full w-full rounded-[11px] bg-[#080C14]/40" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">Hesap Oluştur</h1>
                    <p className="text-[#64748B] mt-1">Synorq ile AI operasyonlarına başla</p>
                </div>

                <div className="form-card rounded-2xl p-8">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="field-label">
                                Ad Soyad
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ad Soyad"
                                required
                                className="field-input"
                            />
                        </div>

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
                                placeholder="En az 6 karakter"
                                minLength={6}
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
                            id="signup-submit"
                            className="btn-primary w-full py-3 font-semibold mt-2"
                        >
                            {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-[#64748B]">
                        Zaten hesabın var mı?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            Giriş yap
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
