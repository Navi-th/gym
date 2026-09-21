import { Button, Input, Select } from "@/shared/ui";
import { STATUS_META, type MemberStatus } from "@/entities/member";

const FILTERABLE: MemberStatus[] = [
  "active",
  "expiring_soon",
  "expired",
  "frozen",
  "lead",
  "churned",
];

/**
 * Search and status filter.
 *
 * A plain GET form: the query lives in the URL, the server does the filtering,
 * and the result is linkable and bookmarkable. No client state, no fetch, no
 * debounce machinery — and it works with JavaScript disabled.
 */
export function MembersFilters({ q, status }: { q: string; status: string }) {
  return (
    <form method="get" action="/admin/members" className="flex flex-wrap items-center gap-3">
      <Input
        name="q"
        defaultValue={q}
        placeholder="Search name, phone or member code…"
        className="max-w-xs"
        aria-label="Search members"
      />

      <Select
        name="status"
        defaultValue={status}
        className="max-w-[190px]"
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {FILTERABLE.map((value) => (
          <option key={value} value={value}>
            {STATUS_META[value].label}
          </option>
        ))}
      </Select>

      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
