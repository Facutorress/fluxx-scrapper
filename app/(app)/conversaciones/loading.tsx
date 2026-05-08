import { Skeleton } from '@/components/skeleton';

export default function ConversacionesLoading() {
  return (
    <div className="space-y-8">
      <div className="pb-6 pt-2">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="section-divider mt-6" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[130px] flex-col justify-between border-l-[3px] border-l-violet border-y border-r border-border bg-surface p-6"
          >
            <Skeleton className="h-3 w-24 bg-bg" />
            <Skeleton className="h-10 w-24 bg-bg" />
          </div>
        ))}
      </div>

      <div className="border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-32 bg-bg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-t border-border px-4 py-4 first:border-t-0">
            <Skeleton className="h-4 w-full bg-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}
