import { createClient } from '@/lib/supabase/server';

interface HeaderProps {
    title: string;
}

export default async function Header({ title }: HeaderProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="h-16 bg-[#080C14]/80 backdrop-blur-md border-b border-[#1E2A3A] pl-16 pr-4 md:px-8 flex items-center justify-between">
            <h1 className="text-[#F1F5F9] font-semibold text-lg">{title}</h1>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm text-[#F1F5F9] font-medium">{user?.user_metadata?.full_name ?? 'Kullanıcı'}</p>
                    <p className="text-xs text-[#64748B]">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                    <span className="text-white text-sm font-medium">
                        {(user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
                    </span>
                </div>
            </div>
        </header>
    );
}
