import { getDb, plans as plansTable } from "@/shared/db";
import type { Plan } from "../model/types";

/** Every plan, active and retired, newest first is not meaningful here — by name. */
export async function getPlans(): Promise<Plan[]> {
  const db = getDb();
  return db.select().from(plansTable);
}

/** Convenience lookup for rendering a plan name from a stored `plan_id`. */
export function planNameById(plans: Plan[]): Map<string, string> {
  return new Map(plans.map((p) => [p.id, p.name]));
}
