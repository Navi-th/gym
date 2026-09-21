import type { plans } from "@/shared/db";

/** Derived from the Drizzle table, so it cannot drift from the schema. */
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

/** Human label for a billing period, e.g. "monthly" -> "Monthly". */
export function billingPeriodLabel(period: Plan["billingPeriod"]): string {
  return period === "annual" ? "Annual" : "Monthly";
}
