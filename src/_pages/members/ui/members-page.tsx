import Link from "next/link";
import { Button, Card, CardContent } from "@/shared/ui";
import { getMembers, type MemberStatus } from "@/entities/member";
import { MembersFilters, MembersTable } from "@/widgets/members-table";

/**
 * Member directory.
 *
 * Reads its filters from the URL rather than client state, so the whole result
 * set is server-rendered and shareable as a link.
 */
export async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = searchParams.q ?? "";
  const status = (searchParams.status ?? "all") as MemberStatus | "all";

  const members = await getMembers({ q, status });
  const filtered = q.trim() !== "" || status !== "all";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Members</h1>
          <p className="mt-1 text-sm text-slate-400">
            {members.length} {members.length === 1 ? "member" : "members"}
            {filtered ? " matching" : ""}
          </p>
        </div>
        <Link href="/admin/members/new">
          <Button>Add member</Button>
        </Link>
      </header>

      <MembersFilters q={q} status={status} />

      <Card>
        <CardContent className="p-0">
          <MembersTable members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
