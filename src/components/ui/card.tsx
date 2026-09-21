import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/lib/members/status";
import { STATUS_META } from "@/lib/members/status";

/**
 * Admin surface panel.
 *
 * Deliberately NOT `.glass-card` from globals.css: that class lifts and glows on
 * hover, which is right for a marketing page and wrong for a dense operational
 * table. These stay flat so rows read clearly.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-slate-800 px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-bold tracking-tight text-white", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-xs text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/** Renders the DERIVED member status, never the raw stage column. */
export function StatusBadge({ status }: { status: MemberStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
