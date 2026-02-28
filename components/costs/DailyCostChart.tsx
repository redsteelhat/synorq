'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DailyCostPoint {
    date: string;
    cost: number;
}

interface DailyCostChartProps {
    data: DailyCostPoint[];
}

function formatAxisTick(value: number): string {
    if (value <= 0.0001) return '$0';
    if (value >= 1) return `$${value.toFixed(2)}`;
    if (value >= 0.01) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(4)}`;
}

const WIDTH = 920;
const HEIGHT = 300;
const MARGIN = { top: 18, right: 18, bottom: 44, left: 56 };

export default function DailyCostChart({ data }: DailyCostChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const normalizedData = useMemo(
        () =>
            data.map((item) => ({
                date: item.date,
                cost: Number.isFinite(item.cost) ? Math.max(0, item.cost) : 0,
            })),
        [data]
    );

    const hasAnySpend = normalizedData.some((item) => item.cost > 0);

    if (!normalizedData.length || !hasAnySpend) {
        return (
            <div className="empty-state flex min-h-[300px] flex-col items-center justify-center px-6">
                <div className="empty-state-icon">
                    <BarChart3 size={20} className="text-[#334155]" />
                </div>
                <h3 className="mb-1 text-[#F1F5F9] font-medium">Henüz maliyet verisi yok</h3>
                <p className="mx-auto mb-6 max-w-xs text-center text-sm text-[#64748B]">
                    Son 14 gün grafiği için önce bir görev çalıştırıp çıktı üretmelisiniz.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/tasks/new" className="btn-primary">
                        İlk görevi çalıştır
                    </Link>
                    <Link href="/tools?filter=all" className="btn-secondary">
                        Araç ekle
                    </Link>
                </div>
            </div>
        );
    }

    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const step = plotWidth / normalizedData.length;
    const barWidth = Math.min(40, step * 0.62);
    const maxCost = Math.max(...normalizedData.map((item) => item.cost), 0.0001);
    const yMax = maxCost * 1.15;
    const ticks = [1, 0.66, 0.33, 0].map((ratio) => yMax * ratio);

    const points = normalizedData.map((item, index) => {
        const x = MARGIN.left + index * step + (step - barWidth) / 2;
        const rawHeight = (item.cost / yMax) * plotHeight;
        const barHeight = item.cost > 0 ? Math.max(rawHeight, 2) : 2;
        const y = MARGIN.top + (plotHeight - barHeight);
        return { ...item, x, y, barHeight };
    });

    const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

    return (
        <div className="relative h-[300px] w-full rounded-xl border border-[#1E2A3A] bg-[#080C14]/70 p-3">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full">
                <defs>
                    <linearGradient id="daily-cost-gradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => {
                    const y = MARGIN.top + (1 - tick / yMax) * plotHeight;
                    return (
                        <g key={tick}>
                            <line
                                x1={MARGIN.left}
                                y1={y}
                                x2={WIDTH - MARGIN.right}
                                y2={y}
                                stroke="rgba(30,42,58,0.8)"
                                strokeWidth="1"
                            />
                            <text
                                x={MARGIN.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-[#334155] text-[10px] font-mono"
                            >
                                {formatAxisTick(tick)}
                            </text>
                        </g>
                    );
                })}

                {points.map((point, index) => {
                    const isHovered = hoveredIndex === index;
                    const showTick = index % 2 === 0 || index === points.length - 1;
                    const label = new Date(point.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });

                    return (
                        <g
                            key={point.date}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex((prev) => (prev === index ? null : prev))}
                        >
                            <rect
                                x={point.x}
                                y={point.y}
                                width={barWidth}
                                height={point.barHeight}
                                rx={6}
                                fill="url(#daily-cost-gradient)"
                                opacity={isHovered ? 1 : 0.9}
                                className="transition-all duration-150"
                            />
                            {showTick && (
                                <text
                                    x={point.x + barWidth / 2}
                                    y={HEIGHT - 14}
                                    textAnchor="middle"
                                    className="fill-[#334155] text-[10px] font-mono"
                                >
                                    {label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {activePoint && (
                <div
                    className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 rounded-lg border border-[#2D3F55] bg-[#0D1321]/95 px-3 py-2 shadow-[0_8px_24px_rgba(2,6,23,0.5)]"
                    style={{
                        left: `${((activePoint.x + barWidth / 2) / WIDTH) * 100}%`,
                        top: `${Math.max(10, ((activePoint.y - 30) / HEIGHT) * 100)}%`,
                    }}
                >
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B]">
                        {new Date(activePoint.date).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                    <p className="mt-1 font-mono text-sm text-[#F1F5F9]">{formatCurrency(activePoint.cost)}</p>
                </div>
            )}
        </div>
    );
}
