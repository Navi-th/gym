import { cache } from "react";
import { desc, eq, sql } from "drizzle-orm";
import {
  getDb,
  members as membersTable,
  subscriptions as subscriptionsTable,
} from "@/shared/db";
import { daysBetween, todayUtc, type PaginatedResult } from "@/shared/lib";
import type { Subscription } from "../model/types";

/**
 * A subscription joined with the member it belongs to.
 */
export type SubscriptionWithMember = Subscription & {
  memberName: string;
  memberCode: string;
  /** Negative once cover has lapsed. */
  daysLeft: number;
};

export type SubscriptionFilter = {
  page?: number;
  pageSize?: number;
  today?: string;
};

const getSubscriptionsCached = cache(
  async (
    today: string,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<SubscriptionWithMember>> => {
    const db = getDb();

    // 1. Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptionsTable)
      .innerJoin(membersTable, eq(subscriptionsTable.memberId, membersTable.id));

    const totalCount = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    // 2. Fetch paginated rows
    const rows = await db
      .select({
        subscription: subscriptionsTable,
        memberName: membersTable.fullName,
        memberCode: membersTable.memberCode,
      })
      .from(subscriptionsTable)
      .innerJoin(membersTable, eq(subscriptionsTable.memberId, membersTable.id))
      .orderBy(desc(subscriptionsTable.endDate))
      .limit(pageSize)
      .offset(offset);

    const data: SubscriptionWithMember[] = rows.map((row) => ({
      ...row.subscription,
      memberName: row.memberName,
      memberCode: row.memberCode,
      daysLeft: daysBetween(today, row.subscription.endDate),
    }));

    return {
      data,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    };
  }
);

/** Subscriptions, paginated (10 per page by default), most recently ended first. */
export async function getSubscriptions(
  options: SubscriptionFilter = {}
): Promise<PaginatedResult<SubscriptionWithMember>> {
  const today = options.today ?? todayUtc();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);

  return getSubscriptionsCached(today, page, pageSize);
}

/** Fetch all subscriptions (unpaginated), used for aggregate metric joins. */
export async function getAllSubscriptions(
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
