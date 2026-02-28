'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    FileText,
    Cpu,
    DollarSign,
    LogOut,
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

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        let isMounted = true;

        async function fetchUserEmail() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (isMounted) {
                setUserEmail(user?.email || '');
            }
        }

        fetchUserEmail();

        return () => {
            isMounted = false;
        };
    }, []);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        onClose();
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
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 group font-medium',
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
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu overlay */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Menüyü kapat"
                    className="fixed inset-0 z-50 bg-black/60 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Desktop & Mobile */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-[60] flex h-full w-[240px] flex-col border-r border-slate-800 bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 md:shadow-none',
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                {/* Mobile close button inside sidebar */}
                {isOpen && (
                    <button
                        onClick={onClose}
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
