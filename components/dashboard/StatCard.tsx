import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    iconColor?: 'indigo' | 'emerald' | 'violet' | 'amber';
}

const iconColorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    violet: 'bg-violet-500/10 text-violet-400',
    amber: 'bg-amber-500/10 text-amber-400',
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, iconColor = 'indigo' }: StatCardProps) {
    return (
        <Card className="bg-[#0D1321] border-[#1E2A3A] hover:border-[#6366F130] hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all duration-200 h-full">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconColorMap[iconColor])}>
                        <Icon size={18} />
                    </div>
                    {trend && (
                        <span
                            className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full border',
                                trend === 'up' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                trend === 'down' && 'bg-red-500/10 text-red-400 border-red-500/20',
                                trend === 'neutral' && 'bg-[#1E2A3A] text-[#64748B] border-[#2D3F55]'
                            )}
                        >
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
                        </span>
                    )}
                </div>
                <div>
                    <h4 className="text-xs text-[#64748B] uppercase tracking-wider font-medium mb-1">{title}</h4>
                    <p className="text-3xl font-bold text-[#F1F5F9] tracking-tight">{value}</p>
                    {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
