import { cn } from "@/shared/lib";

/**
 * Skeleton loading pulse component (Hallmark loading state).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-zinc-200/80", className)}
      {...props}
    />
  );
}
