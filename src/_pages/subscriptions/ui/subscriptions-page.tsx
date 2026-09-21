import { Card, CardContent } from "@/shared/ui";
import { getSubscriptions } from "@/entities/subscription";
import { getPlans, planNameById } from "@/entities/plan";
import { SubscriptionsTable } from "@/widgets/subscriptions-table";

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
    </div>
  );
}
