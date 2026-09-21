import { cn } from "@/shared/lib";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30 focus-visible:outline-rose-500",
  secondary:
    "border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60 focus-visible:outline-slate-500",
  ghost:
    "text-slate-300 hover:bg-slate-800/60 hover:text-white focus-visible:outline-slate-500",
  danger:
    "bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 focus-visible:outline-rose-500",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
