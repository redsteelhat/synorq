import { Skeleton } from '@/components/ui/skeleton';

export default function ToolsLoading() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center pl-16 pr-4 md:px-8">
                <Skeleton className="h-6 w-28" />
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-28 rounded-lg" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <Skeleton className="h-8 w-24 rounded-md" />
                                    <Skeleton className="h-5 w-9 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-7 w-7 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
