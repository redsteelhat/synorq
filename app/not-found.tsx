import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
            <div className="text-center">
                <p className="text-7xl font-bold text-indigo-400">404</p>
                <h1 className="mt-3 text-2xl font-semibold text-white">Sayfa bulunamadı</h1>
                <Link
                    href="/dashboard"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                    Dashboard&apos;a Dön
                </Link>
            </div>
        </div>
    );
}
