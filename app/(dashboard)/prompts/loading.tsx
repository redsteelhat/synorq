import { Skeleton } from '@/components/ui/skeleton';

export default function PromptsLoading() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center pl-16 pr-4 md:px-8">
                <Skeleton className="h-6 w-48" />
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-6 w-10 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-36 rounded-lg" />
                    </div>

                    <div className="space-y-6">
                        <Skeleton className="h-10 w-72 rounded-lg" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-5 w-10 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <div className="flex items-center justify-between pt-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
