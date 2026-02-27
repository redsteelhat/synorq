import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
    return (
        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors shadow-sm h-full">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <Icon size={20} />
                    </div>
                    {trend && (
                        <span
                            className={cn(
                                'text-[11px] font-medium px-2 py-0.5 rounded-md border',
                                trend === 'up' && 'bg-green-500/10 text-green-400 border-green-500/20',
                                trend === 'down' && 'bg-red-500/10 text-red-400 border-red-500/20',
                                trend === 'neutral' && 'bg-slate-800 text-slate-400 border-slate-700'
                            )}
                        >
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
                        </span>
                    )}
                </div>
                <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-1">{title}</h4>
                    <p className="text-3xl font-bold text-slate-50">{value}</p>
                    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
