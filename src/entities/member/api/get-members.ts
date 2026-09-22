import { cache } from "react";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb, members as membersTable, plans as plansTable } from "@/shared/db";
import { addDays, todayUtc, type PaginatedResult } from "@/shared/lib";
import {
  daysUntilExpiry,
  deriveMemberStatus,
  EXPIRING_SOON_DAYS,
  type MemberStatus,
} from "../model/status";
import type { Member } from "../model/types";

/** A member with its DERIVED status attached, ready for display. */
export type MemberWithStatus = Member & {
  status: MemberStatus;
  /** null when the member has no plan end date (e.g. a lead). */
  daysLeft: number | null;
  /** Name of the active/assigned plan, or null if unassigned. */
  planName: string | null;
};

export type MemberSortOption = "newest" | "oldest" | "expiry_asc" | "name_asc";

export type MemberFilter = {
  /** Free-text match against name, phone or member code. */
  q?: string | null;
  status?: MemberStatus | "all" | null;
  planId?: string | "all" | null;
  sort?: MemberSortOption | null;
  page?: number;
  pageSize?: number;
};

function buildMemberConditions(
  q: string | null,
  status: MemberStatus | "all" | null,
  planId: string | "all" | null,
  todayStr: string = todayUtc()
): SQL[] {
  const conditions: SQL[] = [isNull(membersTable.deletedAt)];

  if (q) {
    const pattern = `%${q}%`;
    const search = or(
      like(membersTable.fullName, pattern),
      like(membersTable.phone, pattern),
      like(membersTable.memberCode, pattern)
    );
    if (search) conditions.push(search);
  }

  if (planId && planId !== "all") {
    conditions.push(eq(membersTable.planId, planId));
  }

  if (status && status !== "all") {
    const expiringSoonStr = addDays(todayStr, EXPIRING_SOON_DAYS);

    if (status === "frozen") {
      conditions.push(sql`${membersTable.stage} = 'frozen'`);
    } else if (status === "expired") {
      conditions.push(
        and(
          ne(membersTable.stage, "frozen"),
          isNotNull(membersTable.planEnd),
          lt(membersTable.planEnd, todayStr)
        )!
      );
    } else if (status === "expiring_soon") {
      conditions.push(
        and(
          ne(membersTable.stage, "frozen"),
          isNotNull(membersTable.planEnd),
          gte(membersTable.planEnd, todayStr),
          lte(membersTable.planEnd, expiringSoonStr)
        )!
      );
    } else if (status === "active") {
      conditions.push(
        and(
          ne(membersTable.stage, "frozen"),
          or(isNull(membersTable.planEnd), gt(membersTable.planEnd, expiringSoonStr))
        )!
      );
    }
  }

  return conditions;
}

const getMembersCached = cache(
  async (
    q: string | null,
    status: MemberStatus | "all" | null,
    planId: string | "all" | null,
    sort: MemberSortOption | null,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<MemberWithStatus>> => {
    const db = getDb();
    const today = new Date();
    const todayStr = todayUtc();
    const conditions = buildMemberConditions(q, status, planId, todayStr);

    // Determine sort ordering
    let orderByClause: SQL;
    switch (sort) {
      case "oldest":
        orderByClause = asc(membersTable.createdAt);
        break;
      case "expiry_asc":
        orderByClause = asc(membersTable.planEnd);
        break;
      case "name_asc":
        orderByClause = asc(membersTable.fullName);
        break;
      case "newest":
      default:
        orderByClause = desc(membersTable.createdAt);
        break;
    }

    // 1. Get total count directly in DB
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(membersTable)
      .where(and(...conditions));

    const totalCount = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    // 2. Fetch paginated rows directly in DB with leftJoin to plans
    const rows = await db
      .select({
        member: membersTable,
        planName: plansTable.name,
      })
      .from(membersTable)
      .leftJoin(plansTable, eq(membersTable.planId, plansTable.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    const data: MemberWithStatus[] = rows.map(({ member: m, planName }) => ({
      ...m,
      status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd, today }),
      daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd, today) : null,
      planName: planName ?? null,
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

/**
 * Non-archived members, paginated (10 per page by default) with derived statuses.
 */
export async function getMembers(
  filter: MemberFilter = {}
): Promise<PaginatedResult<MemberWithStatus>> {
  const q = filter.q?.trim() ?? null;
  const status = filter.status ?? null;
  const planId = filter.planId ?? null;
  const sort = filter.sort ?? null;
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.max(1, filter.pageSize ?? 10);

  return getMembersCached(q, status, planId, sort, page, pageSize);
}

/** Fetch all non-archived members (unpaginated), used for aggregate dashboards & queue calculators. */
export async function getAllMembers(): Promise<MemberWithStatus[]> {
  const db = getDb();
  const today = new Date();
  const rows = await db
    .select({
      member: membersTable,
      planName: plansTable.name,
    })
    .from(membersTable)
    .leftJoin(plansTable, eq(membersTable.planId, plansTable.id))
    .where(isNull(membersTable.deletedAt))
    .orderBy(desc(membersTable.createdAt));

  return rows.map(({ member: m, planName }) => ({
    ...m,
    status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd, today }),
    daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd, today) : null,
    planName: planName ?? null,
  }));
}
