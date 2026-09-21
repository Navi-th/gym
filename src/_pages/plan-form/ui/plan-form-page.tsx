import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { getPlanById } from "@/entities/plan";
import { countSubscriptionsForPlan } from "@/entities/subscription";
import { PlanForm } from "@/features/save-plan";

/** Create or edit a single plan. */
export async function PlanFormPage({ planId }: { planId?: string }) {
  const plan = planId ? await getPlanById(planId) : null;
  if (planId && !plan) notFound();

  // Counted here so the form can warn before an edit, rather than reporting
  // afterwards how many members it might have affected. The handler orchestrates
  // this join because the plan and subscription entities may not import each other.
  const activeSubscriptions = plan ? await countSubscriptionsForPlan(plan.id) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <Link
          href="/admin/plans"
          className="text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Plans
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
          {plan ? plan.name : "New plan"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {plan
            ? "Changing price or duration applies to future assignments."
            : "Give it a name, a price and how many days of cover it buys."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{plan ? "Plan details" : "New plan details"}</CardTitle>
          <CardDescription>
            The price is the amount charged per billing period, stored in minor units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanForm
            mode={plan ? "edit" : "create"}
            plan={plan ?? undefined}
            activeSubscriptions={activeSubscriptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
