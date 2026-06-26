import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/Skeleton';

export default function GoalsLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>

      <div className="max-w-4xl mx-auto space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">
          {/* Calendar grid */}
          <div className="w-full md:flex-1 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-2">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="w-full md:w-56 md:shrink-0 space-y-3">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
              <div className="flex justify-center py-2">
                <Skeleton className="w-24 h-24 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
