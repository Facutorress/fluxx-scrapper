import { Skeleton } from '@/components/skeleton';

export default function EstrategiasLoading() {
  return (
    <div className="space-y-8">
      <div className="pb-6 pt-2">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-56" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="section-divider mt-6" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-9 w-44 bg-surface" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border-l-[3px] border-l-violet border-y border-r border-border bg-surface p-5"
          >
            <Skeleton className="h-5 w-2/3 bg-bg" />
            <Skeleton className="mt-2 h-3 w-1/3 bg-bg" />
            <Skeleton className="mt-3 h-3 w-full bg-bg" />
            <Skeleton className="mt-1 h-3 w-4/5 bg-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}
