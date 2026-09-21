import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { getSubscriptions } from "@/entities/subscription";
import { getPlans, planNameById } from "@/entities/plan";
import { SubscriptionsTable } from "@/widgets/subscriptions-table";
import { formatMoneyCompact } from "@/shared/lib";

/** Subscription list: who is covered, until when, and what needs pushing out. */
export async function SubscriptionsPage() {
  const [subscriptions, plans] = await Promise.all([getSubscriptions(), getPlans()]);
  const planNames = planNameById(plans);

  const needingAction = subscriptions.filter((s) => s.daysLeft <= 7).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white">Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-400">
          {subscriptions.length}{" "}
          {subscriptions.length === 1 ? "subscription" : "subscriptions"}
          {needingAction > 0 ? ` · ${needingAction} needing attention` : ""}
        </p>
      </header>

      <Card>
        <CardContent className="p-0">
          <SubscriptionsTable subscriptions={subscriptions} planNameById={planNames} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plans in use</CardTitle>
          <CardDescription>
            Prices shown are per billing period. Renewals charge the plan&apos;s current
            price; amounts already paid are recorded separately.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {plans
            .filter((p) => p.isActive)
            .map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <div className="text-xs font-bold text-white">{plan.name}</div>
                <div className="mt-0.5 text-lg font-black text-rose-300">
                  {formatMoneyCompact(plan.priceCents)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {plan.durationDays} days · {plan.billingPeriod}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
