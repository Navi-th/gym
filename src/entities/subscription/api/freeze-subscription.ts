import { eq } from "drizzle-orm";
import {
  getDb,
  members as membersTable,
  subscriptions as subscriptionsTable,
} from "@/shared/db";
import { applyFreeze } from "../model/expiry";
import type { Subscription } from "../model/types";
import { getSubscriptionById } from "./get-subscription-by-id";

/**
 * Freezes a subscription for a number of days.
 *
 * Freezing PAUSES membership rather than ending it, so the frozen days are
 * added to the end date — the member does not lose the time they paid for.
 * `freeze_days` accumulates across repeated freezes, so the total frozen is
 * always recoverable from the row.
 */
export async function freezeSubscription(input: {
  subscriptionId: string;
  freezeDays: number;
}): Promise<Subscription | null> {
  if (input.freezeDays <= 0) return null;

  const existing = await getSubscriptionById(input.subscriptionId);
  if (!existing) return null;

  const newEnd = applyFreeze({
    endDate: existing.endDate,
    additionalFreezeDays: input.freezeDays,
  });

  const db = getDb();
  const now = new Date().toISOString();

  await db.batch([
    db
      .update(subscriptionsTable)
      .set({
        endDate: newEnd,
        status: "frozen",
        freezeDays: existing.freezeDays + input.freezeDays,
        updatedAt: now,
      })
      .where(eq(subscriptionsTable.id, input.subscriptionId)),

    // Keep the member projection in step — see the ownership invariant in
    // assign-plan.ts.
    db
      .update(membersTable)
      .set({ planEnd: newEnd, stage: "frozen", updatedAt: now })
      .where(eq(membersTable.id, existing.memberId)),
  ]);

  // Read back — see the note in assign-plan.ts on why batch() cannot be
  // cast to the row it wrote.
  return getSubscriptionById(input.subscriptionId);
}
