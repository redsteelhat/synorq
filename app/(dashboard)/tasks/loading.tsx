import { Skeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-16 border-b border-[#1E2A3A] bg-[#080C14]/80 flex items-center pl-16 pr-4 md:px-8">
                <Skeleton className="h-6 w-28" />
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-44" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>

                    <div className="bg-[#0D1321] border border-[#1E2A3A] rounded-xl p-4 shadow-sm">
                        <div className="overflow-x-auto rounded-lg border border-[#1E2A3A]">
                            <table className="min-w-[600px] w-full">
                                <thead>
                                    <tr className="border-b border-[#1E2A3A]">
                                        {Array.from({ length: 6 }).map((_, idx) => (
                                            <th key={idx} className="px-6 py-4">
                                                <Skeleton className="h-4 w-16" />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx} className="border-b border-[#1E2A3A]/50 last:border-b-0">
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
