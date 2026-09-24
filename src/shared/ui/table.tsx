import { cn } from "@/shared/lib";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className={cn("w-full min-w-full sm:min-w-[640px] border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-slate-100 bg-slate-50/70", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-slate-50/80", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-2.5 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-2.5 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm font-medium text-slate-800", className)} {...props} />;
}

/** Centred message row for empty / loading table states. */
export function TableMessage({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-xs sm:text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}
