import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Zap,
  BarChart3,
  Shield,
  Layers,
  BookOpen,
  ArrowRight,
  Check,
  Sparkles,
  Cpu,
  DollarSign,
} from 'lucide-react';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-[#080C14] text-white overflow-x-hidden">
      {/* ── Arka plan efektleri ── */}
      <div className="fixed inset-0 pointer-events-none select-none">
        {/* Grid dokusu */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        {/* Radial gradient glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />
        {/* Subtle side glows */}
        <div
          className="absolute top-[40%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-[#1E2A3A]/50 backdrop-blur-md bg-[#080C14]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">Synorq</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#64748B]">
            <a href="#features" className="hover:text-[#F1F5F9] transition-colors duration-200">
              Özellikler
            </a>
            <a href="#how" className="hover:text-[#F1F5F9] transition-colors duration-200">
              Nasıl Çalışır
            </a>
            <a href="#cta" className="hover:text-[#F1F5F9] transition-colors duration-200">
              Fiyatlar
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-[#64748B] hover:text-[#F1F5F9] text-sm transition-colors duration-200"
            >
              Giriş Yap
            </Link>
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 border border-[#1E2A3A] bg-[#0D1321] rounded-full px-4 py-1.5 mb-10 animate-fade-in">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            <span className="text-[#64748B] text-xs">
              GPT-4o · Claude 3.5 · Gemini 1.5 Pro Destekli
            </span>
          </div>

          {/* Ana başlık */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] animate-fade-up">
            <span className="text-white">AI Araçlarını</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Tek Komuta
            </span>
            <br />
            <span className="text-white">Merkezinden Yönet</span>
          </h1>

          {/* Alt başlık */}
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up-delay">
            ChatGPT, Claude ve Gemini&apos;yi tek panodan çalıştır. Token maliyetlerini gerçek
            zamanlı izle, prompt kütüphaneni yönet ve AI iş akışlarını otomatikleştir.
          </p>

          {/* CTA butonları */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up-delay-2">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
            >
              Ücretsiz Başla
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-[#1E2A3A] hover:border-[#2D3F55] bg-transparent hover:bg-[#111827] text-[#64748B] hover:text-[#F1F5F9] px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
            >
              Demo İncele
            </Link>
          </div>

          <p className="text-[#334155] text-sm mt-6">
            Kredi kartı gerekmez · 14 gün ücretsiz deneme · İstediğin zaman iptal et
          </p>
        </div>

        {/* Mock dashboard önizleme */}
        <div className="relative mt-20 max-w-4xl mx-auto animate-fade-up-delay-2">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-purple-600/20 rounded-3xl blur-2xl" />
          <div className="relative bg-[#0D1321]/80 border border-[#1E2A3A] rounded-2xl p-1 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1E2A3A]/50">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="ml-3 flex-1 bg-[#1E2A3A] rounded-md h-5 max-w-xs" />
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Toplam Token', value: '2.4M', color: 'indigo' },
                { label: 'Aylık Maliyet', value: '$18.40', color: 'emerald' },
                { label: 'Aktif Görev', value: '12', color: 'violet' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-4"
                >
                  <p className="text-[#334155] text-xs mb-1">{stat.label}</p>
                  <p
                    className={`text-2xl font-bold ${
                      stat.color === 'indigo'
                        ? 'text-indigo-400'
                        : stat.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-violet-400'
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
              <div className="col-span-3 bg-[#080C14] border border-[#1E2A3A] rounded-xl p-4 flex gap-3 flex-wrap">
                {['GPT-4o', 'Claude 3.5', 'Gemini 1.5'].map((m) => (
                  <span
                    key={m}
                    className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium"
                  >
                    {m}
                  </span>
                ))}
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── İstatistikler ── */}
      <section className="py-14 border-y border-[#1E2A3A]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10M+', label: 'Token İşlendi' },
            { value: '3x', label: 'Maliyet Tasarrufu' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<100ms', label: 'Yanıt Süresi' },
          ].map((s, i) => (
            <div key={s.label} className={`${i < 3 ? 'md:border-r md:border-[#1E2A3A]' : ''}`}>
              <div className="text-4xl font-bold bg-gradient-to-r from-white to-[#64748B] bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-[#64748B] text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Özellikler ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-[#1E2A3A] bg-[#0D1321] rounded-full px-4 py-1 mb-5">
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest">
                Özellikler
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#F1F5F9] mb-4">
              Profesyonellerin İhtiyacı Olan Her Şey
            </h2>
            <p className="text-[#64748B] text-lg max-w-xl mx-auto">
              AI operasyonlarınızı bir sonraki seviyeye taşımak için tasarlandı.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(
              [
                {
                  icon: Layers,
                  gradient: 'from-indigo-500 to-violet-600',
                  title: 'Multi-AI Yönetimi',
                  desc: "GPT-4o, Claude 3.5 Sonnet ve Gemini 1.5 Pro'yu tek çatı altında yönetin. Model karşılaştırması ve otomatik yönlendirme.",
                },
                {
                  icon: DollarSign,
                  gradient: 'from-emerald-500 to-green-600',
                  title: 'Gerçek Zamanlı Maliyet Analizi',
                  desc: 'Token bazlı maliyet takibi, bütçe uyarıları ve detaylı raporlarla AI harcamalarınızı optimize edin.',
                },
                {
                  icon: BookOpen,
                  gradient: 'from-blue-500 to-indigo-600',
                  title: 'Prompt Kütüphanesi',
                  desc: "Versiyonlama, tagging ve takım paylaşımı. En iyi prompt'larınızı organize edin ve tekrar kullanın.",
                },
                {
                  icon: Zap,
                  gradient: 'from-amber-500 to-orange-500',
                  title: 'Görev Otomasyonu',
                  desc: 'Tekrarlayan AI görevlerini otomatikleştirin. Scheduler ile belirli aralıklarda çalıştırın.',
                },
                {
                  icon: BarChart3,
                  gradient: 'from-violet-500 to-purple-600',
                  title: 'Analitik Dashboard',
                  desc: 'Kullanım istatistikleri, performans metrikleri ve model etkinlik analizleriyle veriye dayalı kararlar alın.',
                },
                {
                  icon: Shield,
                  gradient: 'from-slate-400 to-slate-500',
                  title: 'Güvenlik & Erişim Kontrolü',
                  desc: 'API anahtarlarınızı şifreli saklayın. Rol tabanlı erişim ve audit log ile tam kontrol sağlayın.',
                },
              ] as const
            ).map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-6 hover:border-[#6366F130] hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] transition-all duration-300"
                >
                  <div
                    className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${f.gradient} items-center justify-center mb-5 shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[#F1F5F9] font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ── */}
      <section id="how" className="py-28 px-6 border-y border-[#1E2A3A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 border border-[#1E2A3A] bg-[#0D1321] rounded-full px-4 py-1 mb-5">
              <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">
                Nasıl Çalışır
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#F1F5F9] mb-4">3 Adımda Başlayın</h2>
            <p className="text-[#64748B] text-lg max-w-lg mx-auto">
              Dakikalar içinde kurulum tamamlanır, anında değer görürsünüz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {(
              [
                {
                  step: '01',
                  icon: Cpu,
                  title: 'Hesap Oluştur',
                  desc: "Ücretsiz kaydol, workspace'ini yapılandır ve dakikalar içinde hazır ol.",
                },
                {
                  step: '02',
                  icon: Layers,
                  title: 'AI Araçlarını Bağla',
                  desc: 'OpenAI, Anthropic ve Google API anahtarlarını güvenle ekle, birleşik paneline kavuş.',
                },
                {
                  step: '03',
                  icon: BarChart3,
                  title: 'Optimize Et & Büyü',
                  desc: "Maliyetleri izle, prompt'ları yönet ve AI iş akışlarını otomatikleştir.",
                },
              ] as const
            ).map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[62%] w-[76%] h-px bg-gradient-to-r from-indigo-500/40 to-transparent" />
                  )}
                  <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 items-center justify-center mb-5 shadow-xl shadow-indigo-500/25">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-indigo-400 font-mono text-xs font-bold mb-2 tracking-widest">
                    {step.step}
                  </div>
                  <h3 className="text-[#F1F5F9] font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section id="cta" className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-[#0D1321] to-[#080C14] border border-[#1E2A3A] rounded-3xl p-16 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] rounded-3xl" />
              <div className="relative">
                <h2 className="text-4xl md:text-6xl font-bold text-[#F1F5F9] mb-5 leading-tight">
                  AI Operasyonlarınızı{' '}
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    Dönüştürün
                  </span>
                </h2>
                <p className="text-[#64748B] text-lg mb-10 max-w-xl mx-auto">
                  Bugün başlayın — ilk 14 gün tamamen ücretsiz. Kredi kartı gerekmez.
                </p>
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
                >
                  Ücretsiz Başla
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <div className="flex items-center justify-center gap-6 mt-8 text-sm text-[#64748B] flex-wrap">
                  {['Kredi kartı yok', '14 gün ücretsiz', 'İstediğin zaman iptal'].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E2A3A] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Synorq</span>
          </div>
          <p className="text-[#334155] text-sm">© 2025 Synorq. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <a href="#" className="hover:text-[#F1F5F9] transition-colors">
              Gizlilik
            </a>
            <a href="#" className="hover:text-[#F1F5F9] transition-colors">
              Şartlar
            </a>
            <a href="#" className="hover:text-[#F1F5F9] transition-colors">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
