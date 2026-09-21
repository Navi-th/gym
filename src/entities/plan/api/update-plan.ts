import { eq } from "drizzle-orm";
import { getDb, plans as plansTable } from "@/shared/db";
import type { Plan } from "../model/types";
import type { PlanInput } from "../model/validate";

/**
 * Updates a plan.
 *
 * Rewriting an existing subscription is impossible by construction, not by a
 * guard: subscriptions store their own `start_date`, `end_date` and
 * `price_cents_charged`, so changing this row CANNOT alter what anyone has
 * already been sold. That is exactly why those fields are snapshotted. Editing
 * `durationDays` therefore only affects assignments made from now on.
 *
 * Returns null if the plan does not exist.
 */
export async function updatePlan(id: string, input: PlanInput): Promise<Plan | null> {
  const db = getDb();

  const rows = await db
    .update(plansTable)
    .set({
      name: input.name,
      priceCents: input.priceCents,
      billingPeriod: input.billingPeriod,
      durationDays: input.durationDays,
      isActive: input.isActive,
    })
    .where(eq(plansTable.id, id))
    .returning();

  return rows[0] ?? null;
}
