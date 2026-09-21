import { desc, eq } from "drizzle-orm";
import {
  getDb,
  members as membersTable,
  subscriptions as subscriptionsTable,
} from "@/shared/db";
import { daysBetween, todayUtc } from "@/shared/lib";
import type { Subscription } from "../model/types";

/**
 * A subscription joined with the member it belongs to.
 *
 * Plan NAMES are deliberately not resolved here. The plan belongs to another
 * entity slice, and slices on one layer may not import each other — the page
 * composing this data already has plans in hand and resolves the name itself.
 */
export type SubscriptionWithMember = Subscription & {
  memberName: string;
  memberCode: string;
  /** Negative once cover has lapsed. */
  daysLeft: number;
};

/** All subscriptions, most recently ended first. */
export async function getSubscriptions(
  today: string = todayUtc()
): Promise<SubscriptionWithMember[]> {
  const db = getDb();

  const rows = await db
    .select({
      subscription: subscriptionsTable,
      memberName: membersTable.fullName,
      memberCode: membersTable.memberCode,
    })
    .from(subscriptionsTable)
    .innerJoin(membersTable, eq(subscriptionsTable.memberId, membersTable.id))
    .orderBy(desc(subscriptionsTable.endDate));

  return rows.map((row) => ({
    ...row.subscription,
    memberName: row.memberName,
    memberCode: row.memberCode,
    daysLeft: daysBetween(today, row.subscription.endDate),
  }));
}
