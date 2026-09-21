import Link from "next/link";
import { Button } from "@/shared/ui";
import { getPlans } from "@/entities/plan";
import { PlansTable } from "@/widgets/plans-table";

/**
 * Plan management.
 *
 * Shows retired plans too, greyed out. Hiding them would make an admin think a
 * plan they retired had been deleted — and then create a duplicate.
 */
export async function PlansPage() {
  const plans = await getPlans();
  const onSale = plans.filter((p) => p.isActive).length;
  const retired = plans.length - onSale;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Plans</h1>
          <p className="mt-1 text-sm text-slate-400">
            {onSale} on sale
            {retired > 0 ? ` · ${retired} retired` : ""}
          </p>
        </div>
        <Link href="/admin/plans/new">
          <Button>New plan</Button>
        </Link>
      </header>

      <PlansTable
        plans={plans}
        manage
        description="Duration drives every subscription expiry. Edits affect future assignments only."
      />
    </div>
  );
}
