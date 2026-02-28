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
            <div className="flex h-16 items-center border-b border-[#1E2A3A] px-5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-indigo-500/20">
                        <div className="h-full w-full rounded-[7px] bg-[#080C14]/35" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-semibold tracking-tight text-[15px]">Synorq</span>
                        <span className="text-[10px] text-[#334155] uppercase tracking-[0.15em] font-medium">AI Operations OS</span>
                    </div>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto">
                <div className="text-[9px] font-semibold tracking-[0.15em] text-[#334155] uppercase px-3 mb-1 mt-4">
                    WORKSPACE
                </div>
                <div className="space-y-0.5">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onClose}
                                className={cn(
                                    'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                                    isActive
                                        ? 'bg-[#6366F115] border border-[#6366F130] text-[#F1F5F9] font-medium before:absolute before:left-0 before:h-4 before:w-[2px] before:rounded-full before:bg-indigo-500 before:top-1/2 before:-translate-y-1/2'
                                        : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#111827] border border-transparent'
                                )}
                            >
                                <Icon size={18} className={cn(
                                    "transition-colors",
                                    isActive ? "text-indigo-400" : "text-[#64748B] group-hover:text-[#F1F5F9]"
                                )} />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer / User Email + Logout */}
            <div className="p-4 border-t border-[#1E2A3A] flex-shrink-0">
                <div className="flex items-center gap-3 px-1 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                            {(userEmail?.[0] || 'U').toUpperCase()}
                        </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate flex-1" title={userEmail}>
                        {userEmail}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-md text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
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
                    'fixed inset-y-0 left-0 z-[60] flex h-full w-[240px] flex-col border-r border-[#1E2A3A] bg-[#080C14] shadow-[1px_0_0_0_#1E2A3A] transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                )}
            >
                {/* Mobile close button inside sidebar */}
                {isOpen && (
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-4 right-4 p-2 text-[#64748B] hover:text-white"
                    >
                        <X size={20} />
                    </button>
                )}

                <NavContent />
            </aside>
        </>
    );
}
