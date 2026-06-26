import { Skeleton } from '@/components/ui/Skeleton';

export default function TravelLoading() {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        {/* Summary strip */}
        <div className="mb-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        {/* Hero card */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>

        {/* Upcoming list */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
