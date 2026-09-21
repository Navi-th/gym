import { cn } from "@/lib/utils";

const FIELD_BASE =
  "w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white " +
  "placeholder:text-slate-500 transition-colors focus:border-rose-500 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-semibold text-slate-300", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD_BASE, "min-h-20 resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

/** Label + control + optional hint/error, with wiring handled. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] font-semibold text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
