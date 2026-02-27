import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-50">
            <Sidebar userEmail={user.email || ''} />
            <main className="flex-1 overflow-y-auto min-h-screen relative">
                {children}
            </main>
        </div>
    );
}
