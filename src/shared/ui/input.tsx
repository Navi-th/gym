import { cn } from "@/shared/lib";

const FIELD_BASE =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-xs sm:text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 transition-all focus:border-black focus:ring-1 focus:ring-black focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-50 min-h-[44px]";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-700", className)}
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
  return <textarea className={cn(FIELD_BASE, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, "appearance-none pr-9 bg-[right_1rem_center]", className)} {...props}>
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
        <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
