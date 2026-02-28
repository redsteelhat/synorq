import { Skeleton } from '@/components/ui/skeleton';

export default function CostsLoading() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-16 border-b border-[#1E2A3A] bg-[#080C14]/80 flex items-center pl-16 pr-4 md:px-8">
                <Skeleton className="h-6 w-36" />
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="rounded-xl border border-[#1E2A3A] bg-[#0D1321] p-6 space-y-3">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-6 shadow-sm space-y-4 min-h-[400px]">
                            <Skeleton className="h-6 w-40" />
                            <div className="overflow-x-auto rounded-lg border border-[#1E2A3A]">
                                <table className="min-w-[600px] w-full">
                                    <thead>
                                        <tr className="border-b border-[#1E2A3A]">
                                            {Array.from({ length: 3 }).map((_, idx) => (
                                                <th key={idx} className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 5 }).map((_, idx) => (
                                            <tr key={idx} className="border-b border-[#1E2A3A]/50 last:border-b-0">
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-14 ml-auto" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-6 shadow-sm space-y-4 min-h-[400px]">
                            <Skeleton className="h-6 w-36" />
                            <div className="space-y-3 pt-2">
                                {Array.from({ length: 10 }).map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <Skeleton className="h-3 w-14" />
                                        <Skeleton className="h-3 flex-1 rounded-full" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
