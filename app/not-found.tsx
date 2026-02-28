import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#080C14] text-[#F1F5F9] flex items-center justify-center p-6">
            <div className="text-center">
                <p className="text-7xl font-bold text-indigo-400">404</p>
                <h1 className="mt-3 text-2xl font-semibold text-white">Sayfa bulunamadı</h1>
                <Link
                    href="/dashboard"
                    className="btn-primary mt-6"
                >
                    Dashboard&apos;a Dön
                </Link>
            </div>
        </div>
    );
}
