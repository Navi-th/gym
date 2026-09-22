import { Suspense } from "react";
import { Card, CardContent, Pagination, Skeleton, TableSkeleton } from "@/shared/ui";
import { getAllMembers } from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { getPayments, getRevenueTotals, selectDues } from "@/entities/payment";
import { getAllSubscriptions } from "@/entities/subscription";
import { DuesTable, type DueRow } from "@/widgets/dues-table";
import { PaymentsTable } from "@/widgets/payments-table";
import { formatMoneyCompact, todayUtc } from "@/shared/lib";

async function PaymentsContentSection({
  page,
  searchParams,
}: {
  page: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const today = todayUtc();
  const pageSize = 10;

  const [members, plans, subscriptions, paymentsResult, totals] = await Promise.all([
    getAllMembers(),
    getPlans(),
    getAllSubscriptions(today),
    getPayments({ page, pageSize }),
    getRevenueTotals(today.slice(0, 7)),
  ]);

  const planNames = planNameById(plans);
  const planById = new Map(plans.map((p) => [p.id, p]));
  // O(1) lookup Map instead of O(N) array.find inside loop
  const subscriptionByMemberId = new Map(subscriptions.map((s) => [s.memberId, s]));

  // Arrears come from the member projection; the subscription supplies the id
  // needed to renew, and the plan supplies the price to suggest.
  const dues: DueRow[] = selectDues(members, today).map((member) => {
    const subscription = subscriptionByMemberId.get(member.id) ?? null;
    const plan = member.planId ? planById.get(member.planId) : undefined;

    return {
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      planEnd: member.planEnd as string,
      planName: planNames.get(member.planId ?? "") ?? "—",
      subscriptionId: subscription?.id ?? null,
      planPriceCents: plan?.priceCents ?? subscription?.priceCentsCharged ?? 0,
      planDurationDays: plan?.durationDays ?? 30,
    };
  });

  const stats = [
    { label: "Collected this month", value: formatMoneyCompact(totals.monthCents), tone: "text-zinc-900" },
    { label: "Collected all time", value: formatMoneyCompact(totals.allTimeCents), tone: "text-zinc-900" },
    { label: "Payments recorded", value: String(totals.paymentCount), tone: "text-zinc-900" },
    { label: "In arrears", value: String(dues.length), tone: dues.length > 0 ? "text-rose-600" : "text-emerald-600" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500">
                {stat.label}
              </div>
              <div className={`mt-2 text-2xl sm:text-3xl font-black ${stat.tone}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DuesTable rows={dues} today={today} />
      <div className="space-y-2">
        <PaymentsTable payments={paymentsResult.data} />
        <Pagination
          page={paymentsResult.page}
          totalPages={paymentsResult.totalPages}
          totalCount={paymentsResult.totalCount}
          pageSize={pageSize}
          searchParams={searchParams}
        />
      </div>
    </>
  );
}

/**
 * Money view: who owes, and what has come in.
 */
export function PaymentsPage({
  searchParams = {},
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Payments</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
          Totals reflect money recorded, which is not the same as revenue earned.
        </p>
      </header>

      <Suspense
        key={page}
        fallback={
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <TableSkeleton rows={10} showFilterBar={false} showPagination={true} />
          </div>
        }
      >
        <PaymentsContentSection
          page={page}
          searchParams={searchParams as Record<string, string | string[] | undefined>}
        />
      </Suspense>
    </div>
  );
}
