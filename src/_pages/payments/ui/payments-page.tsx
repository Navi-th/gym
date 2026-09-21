import { Card, CardContent } from "@/shared/ui";
import { getMembers } from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { getPayments, getRevenueTotals, selectDues } from "@/entities/payment";
import { getSubscriptions } from "@/entities/subscription";
import { DuesTable, type DueRow } from "@/widgets/dues-table";
import { PaymentsTable } from "@/widgets/payments-table";
import { formatMoneyCompact, todayUtc } from "@/shared/lib";

/**
 * Money view: who owes, and what has come in.
 *
 * Composed here rather than in a widget because it joins four entities
 * (members, plans, subscriptions, payments), and pages are the layer allowed
 * to do that.
 */
export async function PaymentsPage() {
  const today = todayUtc();

  const [members, plans, subscriptions, payments, totals] = await Promise.all([
    getMembers(),
    getPlans(),
    getSubscriptions(today),
    getPayments({ limit: 100 }),
    getRevenueTotals(today.slice(0, 7)),
  ]);

  const planNames = planNameById(plans);
  const planById = new Map(plans.map((p) => [p.id, p]));

  // Arrears come from the member projection; the subscription supplies the id
  // needed to renew, and the plan supplies the price to suggest.
  const dues: DueRow[] = selectDues(members, today).map((member) => {
    const subscription = subscriptions.find((s) => s.memberId === member.id) ?? null;
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
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Payments</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
          Totals reflect money recorded, which is not the same as revenue earned.
        </p>
      </header>

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
      <PaymentsTable payments={payments} />
    </div>
  );
}
