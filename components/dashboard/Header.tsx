import { createClient } from '@/lib/supabase/server';

interface HeaderProps {
    title: string;
}

export default async function Header({ title }: HeaderProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 px-8 flex items-center justify-between">
            <h1 className="text-white font-semibold text-lg">{title}</h1>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm text-white font-medium">{user?.user_metadata?.full_name ?? 'Kullanıcı'}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                        {(user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
                    </span>
                </div>
            </div>
        </header>
    );
}
