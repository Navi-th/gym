import { Skeleton } from "@/shared/ui";

/**
 * Admin area loading fallback UI during server-side data fetching.
 * Rendered automatically by Next.js Suspense boundaries on route changes.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Skeleton Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>

      {/* Skeleton Metric Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-y border-zinc-200/90 py-5 sm:py-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 pt-3 border-t-2 border-zinc-200 px-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-9 w-16 sm:w-24" />
          </div>
        ))}
      </div>

      {/* Skeleton Filters & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Skeleton Table */}
      <div className="w-full space-y-3 pt-2">
        <div className="h-10 w-full rounded-xl bg-zinc-100/80 border-y border-zinc-200 flex items-center px-4 justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
