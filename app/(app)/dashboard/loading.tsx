import { Skeleton } from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* PageHeader skeleton */}
      <div className="pb-6 pt-2">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-72" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="section-divider mt-6" />
      </div>

      {/* 4 MetricCardV2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[130px] flex-col justify-between border-l-[3px] border-l-violet border-y border-r border-border bg-surface p-6"
          >
            <Skeleton className="h-3 w-24 bg-bg" />
            <Skeleton className="h-12 w-20 bg-bg" />
          </div>
        ))}
      </div>

      {/* StatsRow */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface p-6">
            <Skeleton className="h-3 w-20 bg-bg" />
            <Skeleton className="mt-3 h-7 w-32 bg-bg" />
            <Skeleton className="mt-5 h-[3px] w-full bg-bg" />
            <Skeleton className="mt-3 h-3 w-32 bg-bg" />
          </div>
        ))}
      </div>

      {/* Chart + recientes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-border bg-surface">
          <div className="border-b border-border px-6 py-4">
            <Skeleton className="h-4 w-48 bg-bg" />
          </div>
          <Skeleton className="mx-3 my-5 h-60 bg-bg" />
        </div>
        <div className="border border-border bg-surface">
          <div className="border-b border-border px-6 py-4">
            <Skeleton className="h-4 w-44 bg-bg" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-t border-border px-6 py-4 first:border-t-0">
              <Skeleton className="h-3 w-2/3 bg-bg" />
              <Skeleton className="mt-2 h-3 w-1/2 bg-bg" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-32 bg-bg" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-t border-border px-4 py-4 first:border-t-0">
            <Skeleton className="h-4 w-full bg-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}
