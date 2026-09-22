import { Suspense } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Pagination, TableSkeleton } from "@/shared/ui";
import { getMembers, type MemberStatus, type MemberSortOption } from "@/entities/member";
import { getPlans } from "@/entities/plan";
import { MembersFilters, MembersTable } from "@/widgets/members-table";

async function MembersListSection({
  q,
  status,
  planId,
  sort,
  page,
  searchParams,
}: {
  q: string;
  status: MemberStatus | "all";
  planId: string | "all";
  sort: MemberSortOption;
  page: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageSize = 10;
  const result = await getMembers({ q, status, planId, sort, page, pageSize });
  const filtered = q.trim() !== "" || status !== "all" || planId !== "all";

  return (
    <>
      <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
        {result.totalCount.toLocaleString()} {result.totalCount === 1 ? "member" : "members"}
        {filtered ? " matching" : ""}
      </p>

      <Card className="mt-4">
        <CardContent className="p-0">
          <MembersTable members={result.data} />
        </CardContent>
      </Card>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        pageSize={pageSize}
        searchParams={searchParams}
      />
    </>
  );
}

/**
 * Member directory with optimized server-side pagination and Suspense loading skeletons.
 */
export async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; planId?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q ?? "";
  const status = (searchParams.status ?? "all") as MemberStatus | "all";
  const planId = searchParams.planId ?? "all";
  const sort = (searchParams.sort ?? "newest") as MemberSortOption;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const plans = await getPlans();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">Members</h1>
        </div>
        <Link href="/admin/members/new">
          <Button showPlus iconOnlyOnMobile>Add member</Button>
        </Link>
      </header>

      <MembersFilters q={q} status={status} planId={planId} sort={sort} plans={plans} />

      <Suspense
        key={`${q}-${status}-${planId}-${sort}-${page}`}
        fallback={<TableSkeleton rows={10} showFilterBar={false} showPagination={true} />}
      >
        <MembersListSection
          q={q}
          status={status}
          planId={planId}
          sort={sort}
          page={page}
          searchParams={searchParams as Record<string, string | string[] | undefined>}
        />
      </Suspense>
    </div>
  );
}

