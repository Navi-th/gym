import { Suspense } from "react";
import { Wallet, TrendingUp, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, Pagination, Skeleton, TableSkeleton } from "@/shared/ui";
import { getAllMembers } from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { getPayments, getRevenueTotals, selectDues } from "@/entities/payment";
import { DuesTable, type DueRow } from "@/widgets/dues-table";
import { PaymentsTable } from "@/widgets/payments-table";
import { formatMoneyCompact, todayUtc } from "@/shared/lib";
import { PaymentsTabs } from "./payments-tabs";

async function PaymentsContentSection({
  page,
  searchParams,
}: {
  page: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const today = todayUtc();
  const pageSize = 10;

  const [members, plans, paymentsResult, totals] = await Promise.all([
    getAllMembers(),
    getPlans(),
    getPayments({ page, pageSize }),
    getRevenueTotals(today.slice(0, 7)),
  ]);

  const planNames = planNameById(plans);
  const planById = new Map(plans.map((p) => [p.id, p]));

  const dues: DueRow[] = selectDues(members, today).map((member) => {
    const plan = member.planId ? planById.get(member.planId) : undefined;

    return {
      memberId: member.id,
      memberName: member.fullName,
      memberCode: member.memberCode,
      planEnd: member.planEnd as string,
      planName: planNames.get(member.planId ?? "") ?? "—",
      planPriceCents: plan?.priceCents ?? 0,
    };
  });

  const stats = [
    {
      label: "Collected this month",
      value: formatMoneyCompact(totals.monthCents),
      tone: "text-slate-900",
      icon: <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
    },
    {
      label: "Collected all time",
      value: formatMoneyCompact(totals.allTimeCents),
      tone: "text-slate-900",
      icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
    },
    {
      label: "Payments recorded",
      value: String(totals.paymentCount),
      tone: "text-slate-900",
      icon: <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />,
    },
    {
      label: "In arrears",
      value: String(dues.length),
      tone: dues.length > 0 ? "text-rose-600" : "text-emerald-600",
      icon: <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />,
    },
  ];

  const historyContent = (
    <div className="space-y-3">
      <PaymentsTable payments={paymentsResult.data} />
      <Pagination
        page={paymentsResult.page}
        totalPages={paymentsResult.totalPages}
        totalCount={paymentsResult.totalCount}
        pageSize={pageSize}
        searchParams={searchParams}
      />
    </div>
  );

  const arrearsContent = <DuesTable rows={dues} today={today} />;

  return (
    <div className="space-y-4">
      {/* Stat Cards using standard Card component with compact padding */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-3 sm:!p-4 !space-y-0 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                {stat.label}
              </span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
            </div>
            <div className={`mt-1 sm:mt-2 text-lg sm:text-2xl font-black ${stat.tone} truncate`}>
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <PaymentsTabs
        historyCount={paymentsResult.totalCount}
        duesCount={dues.length}
        historyContent={historyContent}
        arrearsContent={arrearsContent}
      />
    </div>
  );
}

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
