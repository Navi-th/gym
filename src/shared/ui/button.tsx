import { Loader2, PlusCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 shadow-md shadow-black/10 focus-visible:outline-black font-black",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400 focus-visible:outline-zinc-500 font-bold",
  ghost:
    "text-zinc-700 hover:bg-zinc-200/70 hover:text-black focus-visible:outline-zinc-500",
  danger:
    "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-600 font-bold",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5 min-h-[36px]",
  md: "h-11 sm:h-10 px-4 text-xs sm:text-sm rounded-xl gap-2 min-h-[44px] sm:min-h-[40px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Pass true to prepend a circular + icon. */
  showPlus?: boolean;
  /** Pass true to render an animated loading spinner. */
  loading?: boolean;
  /** Pass any custom Lucide icon to prepend. */
  icon?: LucideIcon;
}

export function Button({
  variant = "primary",
  size = "md",
  showPlus = false,
  loading = false,
  icon: Icon,
  disabled,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-colors gap-2",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <>
          {showPlus && <PlusCircle className="h-4 w-4 shrink-0" />}
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
        </>
      )}
      {children}
    </button>
  );
}
