import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb, plans as plansTable } from "@/shared/db";
import type { Plan } from "../model/types";

/** Every plan, active and retired, newest first is not meaningful here — by name. */
export const getPlans = cache(async function getPlans(): Promise<Plan[]> {
  const db = getDb();
  return db.select().from(plansTable);
});

export const getPlansCached = unstable_cache(
  async () => getPlans(),
  ["plans-list"],
  { tags: ["plans"], revalidate: 3600 }
);

/** Convenience lookup for rendering a plan name from a stored `plan_id`. */
export function planNameById(plans: Plan[]): Map<string, string> {
  return new Map(plans.map((p) => [p.id, p.name]));
}

