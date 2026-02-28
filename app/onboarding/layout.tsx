import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/auth/SignOutButton';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-between text-slate-200 overflow-hidden relative">

            {/* Minimal Header */}
            <div className="w-full h-16 max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Synorq</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                    <span>{user.email}</span>
                    <SignOutButton />
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 w-full max-w-2xl mx-auto px-4 flex items-center justify-center relative z-10">
                {children}
            </div>

        </div>
    );
}
