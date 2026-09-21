import { eq, sql } from "drizzle-orm";
import {
  getDb,
  members as membersTable,
  subscriptions as subscriptionsTable,
} from "@/shared/db";
import { newId, todayUtc } from "@/shared/lib";
import { MemberAlreadySubscribedError } from "../model/errors";
import { computePeriodEnd } from "../model/expiry";
import { getActiveSubscription } from "./get-active-subscription";
import { getSubscriptionById } from "./get-subscription-by-id";
import type { Subscription } from "../model/types";

/**
 * Assigns a plan to a member.
 *
 * Creates the subscription row AND projects the plan dates onto the member
 * row, in a single atomic batch() — D1 cannot span a transaction across
 * separate calls, so a failure halfway would otherwise leave a subscription
 * with no matching member dates, or the reverse.
 *
 * ---------------------------------------------------------------------------
 * OWNERSHIP INVARIANT — do not break this.
 *
 * `members.plan_id`, `members.plan_start` and `members.plan_end` are a
 * DENORMALISED PROJECTION of the member's subscription. They are written from
 * this file and nowhere else. If any other code updates them, the projection
 * drifts from the subscription history and the member list starts disagreeing
 * with it — with no way to tell which one is right.
 *
 * They are denormalised at all because the member list filters and sorts by
 * expiry, and joining subscriptions into every row would make that query
 * heavier for no benefit at this size.
 * ---------------------------------------------------------------------------
 *
 * The plan's duration and price are passed IN rather than looked up here:
 * entities on the same layer may not import each other, and the caller already
 * has the plan in hand. Passing the price in also makes the snapshot explicit
 * at the call site instead of implicit.
 */
export async function assignPlan(input: {
  memberId: string;
  planId: string;
  durationDays: number;
  priceCents: number;
  /** Defaults to today. */
  startDate?: string;
}): Promise<Subscription> {
  const db = getDb();

  // Refuse to stack a second running subscription on the same member. Without
  // this, a double-clicked button silently creates two, the member is billed
  // twice, and nobody can tell which row is the real one.
  const existing = await getActiveSubscription(input.memberId);
  if (existing) {
    throw new MemberAlreadySubscribedError(input.memberId, existing.endDate);
  }

  const startDate = input.startDate ?? todayUtc();
  const endDate = computePeriodEnd(startDate, input.durationDays);
  const now = new Date().toISOString();
  const id = newId();

  await db.batch([
    db.insert(subscriptionsTable).values({
      id,
      memberId: input.memberId,
      planId: input.planId,
      startDate,
      endDate,
      status: "active",
      // The price agreed for THIS period. Plans change over time, and
      // historical revenue must not silently re-price itself.
      priceCentsCharged: input.priceCents,
      freezeDays: 0,
      createdAt: now,
      updatedAt: now,
    }),

    db
      .update(membersTable)
      .set({
        planId: input.planId,
        planStart: startDate,
        planEnd: endDate,
        // Promote a lead or a returning ex-member to active, but never
        // silently un-freeze someone who is deliberately frozen. Written as
        // SQL so it needs no extra read and cannot race.
        stage: sql`CASE WHEN ${membersTable.stage} IN ('lead', 'churned') THEN 'active' ELSE ${membersTable.stage} END`,
        updatedAt: now,
      })
      .where(eq(membersTable.id, input.memberId)),
  ]);

  // Read back rather than trusting the batch return value. The D1 driver
  // resolves batch() to D1Result objects, not to the inserted rows — casting
  // one to a Subscription compiles but hands back a wrapper, not the row.
  // Reading what is actually stored is also the honest check that the write
  // landed.
  const created = await getSubscriptionById(id);
  if (!created) {
    throw new Error(
      `Subscription ${id} was written but could not be read back.`
    );
  }
  return created;
}
