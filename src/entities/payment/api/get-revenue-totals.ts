import { cache } from "react";
import { count, like, sum } from "drizzle-orm";
import { getDb, payments as paymentsTable } from "@/shared/db";

export type RevenueTotals = {
  /** Everything ever recorded. */
  allTimeCents: number;
  /** Everything recorded in the given `YYYY-MM`. */
  monthCents: number;
  paymentCount: number;
};

/**
 * Revenue totals.
 *
 * Aggregated in SQL rather than by loading every payment into memory and
 * summing there: a gym that has been running for years would otherwise pull
 * thousands of rows on every dashboard render to display one number.
 *
 * These are totals of what was RECORDED, which is not the same as revenue
 * earned — cash taken for a future period is recorded today.
 */
export const getRevenueTotals = cache(async function getRevenueTotals(
  monthPrefix: string
): Promise<RevenueTotals> {
  const db = getDb();

  const [allTime, month, counted] = await Promise.all([
    db.select({ value: sum(paymentsTable.amountCents) }).from(paymentsTable),
    db
      .select({ value: sum(paymentsTable.amountCents) })
      .from(paymentsTable)
      .where(like(paymentsTable.paidAt, `${monthPrefix}%`)),
    db.select({ value: count() }).from(paymentsTable),
  ]);

  return {
    // SQLite's SUM comes back as a string (or null when there are no rows).
    allTimeCents: Number(allTime[0]?.value ?? 0),
    monthCents: Number(month[0]?.value ?? 0),
    paymentCount: counted[0]?.value ?? 0,
  };
});

