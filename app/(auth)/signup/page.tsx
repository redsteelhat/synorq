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
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8">
                        <div className="text-4xl mb-4">📧</div>
                        <h2 className="text-xl font-bold text-white mb-2">E-postanı doğrula</h2>
                        <p className="text-slate-400">
                            <strong className="text-white">{email}</strong> adresine doğrulama bağlantısı gönderdik.
                            E-postanı kontrol et ve hesabını aktive et.
                        </p>
                        <Link href="/login" className="block mt-6 text-purple-400 hover:text-purple-300 text-sm">
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
                    <p className="text-slate-400 mt-1">Synorq ile AI operasyonlarına başla</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Ad Soyad
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ad Soyad"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                E-posta
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@email.com"
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
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
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
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
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 mt-2"
                        >
                            {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-400">
                        Zaten hesabın var mı?{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            Giriş yap
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
