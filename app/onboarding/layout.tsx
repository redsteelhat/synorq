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
        <div className="h-screen w-screen bg-[#080C14] flex flex-col items-center justify-between text-[#F1F5F9] overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.16),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            </div>

            {/* Minimal Header */}
            <div className="w-full h-16 max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 p-[1px] shadow-lg shadow-indigo-500/20">
                        <div className="h-full w-full rounded-[7px] bg-[#080C14]/35" />
                    </div>
                    <span className="text-lg font-semibold text-[#F1F5F9] tracking-tight">Synorq</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-[#64748B]">
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
