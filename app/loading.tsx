import { Skeleton } from "@/shared/ui";

/**
 * Global root loading fallback UI.
 */
export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-xl space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
