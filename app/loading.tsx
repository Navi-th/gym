import { Loader2 } from "lucide-react";

/**
 * Global root page-loading circular loader.
 */
export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Loading application...</span>
    </div>
  );
}

