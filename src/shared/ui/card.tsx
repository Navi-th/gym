import { cn } from "@/shared/lib";

/**
 * Open-plan section container (Hallmark Anti-Card architecture).
 *
 * Removes heavy card boxes and shadows in favor of clean typographic hierarchy,
 * open whitespace, and hairline section dividers.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "w-full space-y-4 pt-2 pb-6 border-b border-zinc-200/80 last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-zinc-200/80",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg sm:text-xl font-black tracking-tight text-zinc-900", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs sm:text-sm font-medium text-zinc-500 leading-relaxed", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-2", className)} {...props} />;
}
