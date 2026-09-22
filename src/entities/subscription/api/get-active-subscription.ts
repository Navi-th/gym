import { cache } from "react";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb, subscriptions as subscriptionsTable } from "@/shared/db";
import { todayUtc } from "@/shared/lib";
import type { Subscription } from "../model/types";

const getActiveSubscriptionCached = cache(
  async (memberId: string, today: string): Promise<Subscription | null> => {
    const db = getDb();
    const rows = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.memberId, memberId),
          gte(subscriptionsTable.endDate, today)
        )
      )
      .orderBy(desc(subscriptionsTable.endDate))
      .limit(1);

    return rows[0] ?? null;
  }
);

/**
 * The member's currently-running subscription, if any.
 *
 * "Currently running" is judged by endDate, not by the stored status column —
 * the same principle as member status: a row whose status still says "active"
 * but whose end date has passed is not cover.
 */
export async function getActiveSubscription(
  memberId: string,
  today: string = todayUtc()
): Promise<Subscription | null> {
  return getActiveSubscriptionCached(memberId, today);
}

