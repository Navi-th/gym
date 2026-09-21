import { cn } from "@/shared/lib";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto border-y border-zinc-200/80 my-2">
      <table className={cn("w-full min-w-[720px] border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-zinc-200 bg-zinc-100/70", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-zinc-200/60", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-zinc-100/60", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-500",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 text-xs sm:text-sm font-medium text-zinc-800", className)} {...props} />;
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
      <td colSpan={colSpan} className="px-4 py-12 text-center text-xs sm:text-sm text-zinc-500">
        {children}
      </td>
    </tr>
  );
}
