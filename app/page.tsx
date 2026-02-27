import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white font-bold text-xl">Synorq</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Giriş Yap
          </Link>
          <Link
            href="/signup"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-300 text-sm font-medium">AI Operations Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Tüm AI Araçlarını{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tek Yerden
          </span>{' '}
          Yönet
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          ChatGPT, Claude ve Gemini&apos;yi tek bir panelden çalıştır. Maliyetleri takip et,
          prompt&apos;larını yönet ve AI görevlerini otomatikleştir.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Ücretsiz Başla →
          </Link>
          <Link
            href="/login"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-xl text-lg font-medium transition-all"
          >
            Demo İncele
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 w-full">
          {[
            { icon: '🤖', title: 'Multi-AI Desteği', desc: 'GPT-4o, Claude 3.5, Gemini 1.5 Pro' },
            { icon: '💰', title: 'Maliyet Takibi', desc: 'Token bazlı gerçek zamanlı maliyet analizi' },
            { icon: '📋', title: 'Prompt Kütüphanesi', desc: 'Versiyonlama ve takım paylaşımı' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-left hover:border-purple-700/50 transition-colors"
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-slate-600 text-sm">
        © 2025 Synorq. Tüm hakları saklıdır.
      </footer>
    </main>
  );
}
