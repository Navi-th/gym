import { cn } from "@/shared/lib";

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
        "rounded-2xl border border-zinc-200/90 bg-white shadow-sm shadow-zinc-200/50 overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-zinc-100 px-4 py-3.5 sm:px-6 sm:py-4 bg-zinc-50/30", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base sm:text-lg font-black tracking-tight text-zinc-900", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

