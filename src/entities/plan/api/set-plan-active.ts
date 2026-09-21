import { eq } from "drizzle-orm";
import { getDb, plans as plansTable } from "@/shared/db";
import type { Plan } from "../model/types";

/**
 * Retires or un-retires a plan.
 *
 * This is what "delete" means for a plan. A real DELETE is not available:
 * `subscriptions.plan_id` references it, so removing the row would either fail
 * or orphan a member's history. Retiring hides it from new assignments while
 * leaving everything already sold intact.
 */
export async function setPlanActive(
  id: string,
  isActive: boolean
): Promise<Plan | null> {
  const db = getDb();

  const rows = await db
    .update(plansTable)
    .set({ isActive })
    .where(eq(plansTable.id, id))
    .returning();

  return rows[0] ?? null;
}
