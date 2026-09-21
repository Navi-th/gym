import { count, eq } from "drizzle-orm";
import { getDb, subscriptions as subscriptionsTable } from "@/shared/db";

/**
 * How many subscriptions reference a plan.
 *
 * Used to tell an admin, before they edit a price or duration, how many
 * members are already on this plan — so "affects 12 members from now on, none
 * retrospectively" is something they can see rather than infer.
 */
export async function countSubscriptionsForPlan(planId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ value: count() })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.planId, planId));

  return rows[0]?.value ?? 0;
}
