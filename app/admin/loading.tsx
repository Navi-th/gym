import { Loader2 } from "lucide-react";

/**
 * Admin portal loading fallback component.
 * Next.js App Router displays this fallback inside AdminShell during client-side
 * route transitions between admin pages.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 rounded-[20px] sm:rounded-[24px] bg-white border border-slate-100 p-8 shadow-xs">
      <div className="w-10 h-10 rounded-full bg-[#C4FF00] flex items-center justify-center shadow-xs">
        <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
      </div>
      <span className="text-xs font-bold tracking-wide text-slate-500 uppercase font-display">
        Loading view...
      </span>
    </div>
  );
}
