import { cache } from "react";
import { asc, desc } from "drizzle-orm";
import { automationRules as rulesTable, getDb } from "@/shared/db";
import type { AutomationRule } from "../model/types";

/**
 * Every rule, in a stable order.
 *
 * Ordered by trigger then offset descending, NOT by `createdAt`: the four seeded
 * rules are written by a single INSERT and therefore share one `datetime('now')`,
 * so `createdAt` is not a tie-breaker and the list would reshuffle between
 * renders for no reason.
 */
export const getRules = cache(async function getRules(): Promise<AutomationRule[]> {
  const db = getDb();
  return db
    .select()
    .from(rulesTable)
    .orderBy(asc(rulesTable.trigger), desc(rulesTable.offsetDays));
});

/** Only the rules that should fire — the page must never evaluate disabled ones. */
export async function getEnabledRules(): Promise<AutomationRule[]> {
  const rules = await getRules();
  return rules.filter((rule) => rule.isEnabled);
}
