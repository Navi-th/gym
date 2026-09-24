import { STATUS_META, type MemberStatus } from "../model/status";

/**
 * Renders the DERIVED member status, never the raw `stage` column.
 *
 * This lives in the member entity's `ui` segment — not in `shared/ui` —
 * because it knows what a Member is. `shared/ui` is reserved for primitives
 * that know nothing about the business domain.
 */
export function MemberStatusBadge({ status }: { status: MemberStatus | string }) {
  const meta = STATUS_META[status as MemberStatus] ?? STATUS_META.active;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
