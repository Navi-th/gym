import { and, asc, eq, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb, members as membersTable, plans as plansTable } from "@/shared/db";
import { todayUtc, type PaginatedResult } from "@/shared/lib";

export type DueRowItem = {
  memberId: string;
  memberName: string;
  memberCode: string;
  planEnd: string;
  planName: string;
  planPriceCents: number;
};

import { unstable_cache } from "next/cache";

export async function getDuesCount(todayStr: string = todayUtc()): Promise<number> {
  const db = getDb();
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(membersTable)
    .where(
      and(
        isNull(membersTable.deletedAt),
        ne(membersTable.stage, "frozen"),
        isNotNull(membersTable.planEnd),
        lt(membersTable.planEnd, todayStr)
      )
    );

  return Number(countResult[0]?.count ?? 0);
}

export const getDuesCountCached = (todayStr: string) =>
  unstable_cache(
    async () => getDuesCount(todayStr),
    [`dues-count-${todayStr}`],
    { tags: ["dues-count", "members"], revalidate: 300 }
  )();

export async function getDues(options: {
  page?: number;
  pageSize?: number;
  todayStr?: string;
} = {}): Promise<PaginatedResult<DueRowItem>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const todayStr = options.todayStr ?? todayUtc();

  const db = getDb();

  const conditions = [
    isNull(membersTable.deletedAt),
    ne(membersTable.stage, "frozen"),
    isNotNull(membersTable.planEnd),
    lt(membersTable.planEnd, todayStr),
  ];

  const totalCount = await getDuesCount(todayStr);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select({
      memberId: membersTable.id,
      memberName: membersTable.fullName,
      memberCode: membersTable.memberCode,
      planEnd: membersTable.planEnd,
      planName: plansTable.name,
      planPriceCents: plansTable.priceCents,
    })
    .from(membersTable)
    .leftJoin(plansTable, eq(membersTable.planId, plansTable.id))
    .where(and(...conditions))
    .orderBy(asc(membersTable.planEnd))
    .limit(pageSize)
    .offset(offset);

  const data: DueRowItem[] = rows.map((r) => ({
    memberId: r.memberId,
    memberName: r.memberName,
    memberCode: r.memberCode,
    planEnd: r.planEnd as string,
    planName: r.planName ?? "—",
    planPriceCents: r.planPriceCents ?? 0,
  }));

  return {
    data,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
  };
}
