import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function TasksLoading() {
  return (
    <PageContainer>
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Workstream tabs */}
      <div className="mb-5">
        <Skeleton className="h-9 w-full max-w-sm rounded-full" />
      </div>

      {/* Panel header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-40 rounded-xl" />
      </div>

      {/* Table rows */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(i < 6 && 'border-b border-zinc-100 dark:border-zinc-800/60')}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1 max-w-[280px]" />
              <Skeleton className="h-4 w-16 rounded-md hidden sm:block" />
              <Skeleton className="h-4 w-20 rounded-md hidden md:block" />
              <Skeleton className="h-4 w-14 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
