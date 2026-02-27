'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    FileText,
    Cpu,
    DollarSign,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/prompts', label: 'Prompts', icon: FileText },
    { href: '/tools', label: 'AI Tools', icon: Cpu },
    { href: '/costs', label: 'Costs', icon: DollarSign },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    const NavContent = () => (
        <>
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-slate-800/60 bg-slate-900/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <span className="text-white font-bold tracking-wide">Synorq</span>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group font-medium',
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            )}
                        >
                            <Icon size={18} className={cn(
                                "transition-colors",
                                isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Email + Logout */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 flex-shrink-0">
                <div className="mb-3 px-2">
                    <p className="text-xs font-medium text-slate-500 truncate" title={userEmail}>
                        {userEmail}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Hamburger toggle */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-md shadow-sm"
            >
                <Menu size={20} />
            </button>

            {/* Mobile menu overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Desktop & Mobile */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-[70] flex flex-col w-[240px] bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none h-full",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Mobile close button inside sidebar */}
                {isMobileOpen && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}

                <NavContent />
            </aside>
        </>
    );
}
