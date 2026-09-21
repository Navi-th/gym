import { eq } from "drizzle-orm";
import {
  getDb,
  members as membersTable,
  subscriptions as subscriptionsTable,
} from "@/shared/db";
import { todayUtc } from "@/shared/lib";
import { computeRenewalPeriod } from "../model/expiry";
import type { Subscription } from "../model/types";
import { getSubscriptionById } from "./get-subscription-by-id";

/**
 * Renews a subscription by extending its current period.
 *
 * Renewing EXTENDS the existing row rather than inserting a new one. Per-period
 * history already lives in `payments` — every row carries its own period_start
 * and period_end — so one subscription row per month would add rows without
 * adding information, and would make "the member's subscription" ambiguous.
 *
 * Because periods are extended, `price_cents_charged` means "the price agreed
 * for the CURRENT period". It is updated here on renewal, while the amounts
 * actually paid stay immutable in `payments`.
 *
 * See computeRenewalPeriod for why renewing early does not cost the member days
 * they have already paid for.
 */
export async function renewSubscription(input: {
  subscriptionId: string;
  durationDays: number;
  priceCents: number;
  today?: string;
}): Promise<Subscription | null> {
  const existing = await getSubscriptionById(input.subscriptionId);
  if (!existing) return null;

  const period = computeRenewalPeriod({
    currentEnd: existing.endDate,
    today: input.today ?? todayUtc(),
    durationDays: input.durationDays,
  });

  const db = getDb();
  const now = new Date().toISOString();

  await db.batch([
    db
      .update(subscriptionsTable)
      .set({
        startDate: period.startDate,
        endDate: period.endDate,
        status: "active",
        priceCentsCharged: input.priceCents,
        updatedAt: now,
      })
      .where(eq(subscriptionsTable.id, input.subscriptionId)),

    // Keep the member projection in step — see the ownership invariant in
    // assign-plan.ts.
    db
      .update(membersTable)
      .set({
        planStart: period.startDate,
        planEnd: period.endDate,
        stage: "active",
        updatedAt: now,
      })
      .where(eq(membersTable.id, existing.memberId)),
  ]);

  // Read back — see the note in assign-plan.ts on why batch() cannot be
  // cast to the row it wrote.
  return getSubscriptionById(input.subscriptionId);
}
