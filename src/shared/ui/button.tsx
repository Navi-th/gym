import { Loader2, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#C4FF00] text-slate-900 hover:bg-[#b2eb00] font-bold shadow-xs focus-visible:outline-slate-900",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-500 font-semibold",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-500 font-medium",
  danger:
    "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-600 font-semibold",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs rounded-full gap-1.5 min-h-[36px]",
  md: "h-10 px-4 text-xs sm:text-sm rounded-full gap-2 min-h-[40px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Pass true to prepend a + icon. */
  showPlus?: boolean;
  /** Pass true to render an animated loading spinner. */
  loading?: boolean;
  /** Pass any custom Lucide icon to prepend. */
  icon?: LucideIcon;
  /** Pass true (or default when showPlus) to show circular icon-only on mobile devices (<640px). */
  iconOnlyOnMobile?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  showPlus = false,
  loading = false,
  icon: Icon,
  iconOnlyOnMobile = false,
  disabled,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const isIconOnlyMobile = iconOnlyOnMobile || showPlus || !!Icon;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all gap-1.5 active:scale-95 select-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        isIconOnlyMobile && "w-10 h-10 p-0 rounded-full sm:w-auto sm:h-10 sm:px-4 sm:rounded-full shrink-0",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <>
          {showPlus && <Plus className="h-5 w-5 shrink-0" />}
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
        </>
      )}
      {children && (
        <span className={cn(isIconOnlyMobile && "hidden sm:inline-block")}>
          {children}
        </span>
      )}
    </button>
  );
}
