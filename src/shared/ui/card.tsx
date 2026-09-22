import { cn } from "@/shared/lib";

/**
 * Tactile card container matching high-end iOS mobile aesthetics.
 * Features 20px/24px rounded corners, pure white background, subtle hairline border,
 * and mobile-optimized 8pt grid padding (p-3.5 sm:p-6).
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 border border-slate-100 shadow-xs space-y-3 sm:space-y-4",
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
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-2.5 sm:pb-3 border-b border-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs sm:text-sm font-medium text-slate-500 leading-relaxed", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0.5 sm:pt-1", className)} {...props} />;
}
