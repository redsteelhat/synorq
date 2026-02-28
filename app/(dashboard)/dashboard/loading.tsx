import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-16 border-b border-[#1E2A3A] bg-[#080C14]/80 flex items-center pl-16 pr-4 md:px-8">
                <Skeleton className="h-6 w-36" />
            </div>

            <div className="p-4 md:p-8 space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-72" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="rounded-xl border border-[#1E2A3A] bg-[#0D1321] p-6 space-y-4">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-[#1E2A3A] bg-[#0D1321] overflow-hidden">
                    <div className="p-6 border-b border-[#1E2A3A] flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="p-4 md:p-6 flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-36" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
