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
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Subscriptions</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
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
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="text-xs font-bold text-zinc-900">{plan.name}</div>
                <div className="mt-0.5 text-lg font-black text-zinc-900">
                  {formatMoneyCompact(plan.priceCents)}
                </div>
                <div className="text-[11px] font-medium text-zinc-500">
                  {plan.durationDays} days · {plan.billingPeriod}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
