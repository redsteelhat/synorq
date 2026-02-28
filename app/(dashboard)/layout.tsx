'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleViewport = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setIsSidebarOpen(false);
            }
        };

        mediaQuery.addEventListener('change', handleViewport);
        return () => mediaQuery.removeEventListener('change', handleViewport);
    }, []);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-50">
            <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="fixed left-4 top-4 z-[70] md:hidden rounded-md border border-slate-700 bg-slate-900 p-2 text-slate-200 shadow-sm"
                aria-label="Menüyü aç"
            >
                <Menu size={20} />
            </button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 overflow-y-auto min-h-screen relative">
                {children}
            </main>
        </div>
    );
}
