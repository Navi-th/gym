import { Skeleton } from "./skeleton";

export type TableSkeletonProps = {
  /** Number of skeleton rows to render. Defaults to 10. */
  rows?: number;
  /** Show top count/filter bar skeleton. Defaults to true. */
  showFilterBar?: boolean;
  /** Show bottom pagination bar skeleton. Defaults to true. */
  showPagination?: boolean;
};

/**
 * Reusable table skeleton loader for data-fetching server components.
 * Displays animated row & pagination placeholders while D1 data streams in.
 */
export function TableSkeleton({
  rows = 10,
  showFilterBar = false,
  showPagination = true,
}: TableSkeletonProps) {
  return (
    <div className="w-full space-y-4 pt-1 animate-in fade-in duration-150">
      {showFilterBar && (
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
      )}

      <div className="w-full overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/70 px-4 py-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <div className="divide-y divide-zinc-200/60">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-1">
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
