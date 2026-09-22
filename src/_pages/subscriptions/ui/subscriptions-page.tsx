import { Suspense } from "react";
import { Card, CardContent, Pagination, TableSkeleton } from "@/shared/ui";
import { getSubscriptions } from "@/entities/subscription";
import { getPlans, planNameById } from "@/entities/plan";
import { SubscriptionsTable } from "@/widgets/subscriptions-table";

async function SubscriptionsListSection({
  page,
  searchParams,
}: {
  page: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageSize = 10;
  const [subResult, plans] = await Promise.all([
    getSubscriptions({ page, pageSize }),
    getPlans(),
  ]);

  const planNames = planNameById(plans);
  const needingAction = subResult.data.filter((s) => s.daysLeft <= 7).length;

  return (
    <>
      <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
        {subResult.totalCount.toLocaleString()}{" "}
        {subResult.totalCount === 1 ? "subscription" : "subscriptions"}
        {needingAction > 0 ? ` · ${needingAction} on this page needing attention` : ""}
      </p>

      <Card className="mt-4">
        <CardContent className="p-0">
          <SubscriptionsTable subscriptions={subResult.data} planNameById={planNames} />
        </CardContent>
      </Card>

      <Pagination
        page={subResult.page}
        totalPages={subResult.totalPages}
        totalCount={subResult.totalCount}
        pageSize={pageSize}
        searchParams={searchParams}
      />
    </>
  );
}

/** Subscription list with optimized server-side pagination and Suspense skeleton. */
export function SubscriptionsPage({
  searchParams = {},
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Subscriptions</h1>
      </header>

      <Suspense
        key={page}
        fallback={<TableSkeleton rows={10} showFilterBar={false} showPagination={true} />}
      >
        <SubscriptionsListSection
          page={page}
          searchParams={searchParams as Record<string, string | string[] | undefined>}
        />
      </Suspense>
    </div>
  );
}
