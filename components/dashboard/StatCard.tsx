import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-700/30 flex items-center justify-center">
                    <Icon size={20} className="text-purple-400" />
                </div>
                {trend && (
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            trend === 'up' && 'bg-green-900/30 text-green-400',
                            trend === 'down' && 'bg-red-900/30 text-red-400',
                            trend === 'neutral' && 'bg-slate-700 text-slate-400'
                        )}
                    >
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm text-slate-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
