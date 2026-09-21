import { and, isNull, like, or, type SQL } from "drizzle-orm";
import { getDb, members as membersTable } from "@/shared/db";
import { daysUntilExpiry, deriveMemberStatus, type MemberStatus } from "../model/status";
import type { Member } from "../model/types";

/** A member with its DERIVED status attached, ready for display. */
export type MemberWithStatus = Member & {
  status: MemberStatus;
  /** null when the member has no plan end date (e.g. a lead). */
  daysLeft: number | null;
};

export type MemberFilter = {
  /** Free-text match against name, phone or member code. */
  q?: string | null;
  status?: MemberStatus | "all" | null;
};

/**
 * Non-archived members, each with its derived status.
 *
 * Always prefer this over reading `member.stage` directly: `stage` holds only
 * manual states, so it will happily report "active" for someone whose plan
 * lapsed last month.
 */
export async function getMembers(filter: MemberFilter = {}): Promise<MemberWithStatus[]> {
  const db = getDb();
  const conditions: SQL[] = [isNull(membersTable.deletedAt)];

  const term = filter.q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    const search = or(
      like(membersTable.fullName, pattern),
      like(membersTable.phone, pattern),
      like(membersTable.memberCode, pattern)
    );
    if (search) conditions.push(search);
  }

  const rows = await db
    .select()
    .from(membersTable)
    .where(and(...conditions));

  const withStatus: MemberWithStatus[] = rows.map((m) => ({
    ...m,
    status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd }),
    daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd) : null,
  }));

  // Status is DERIVED, so it cannot be filtered in SQL without restating the
  // expiry rule as a SQL expression — which would immediately become a second
  // source of truth. Filtering here is correct and keeps one rule. If the
  // table ever grows large, express it in SQL but keep deriveMemberStatus
  // authoritative and test the two against each other.
  const status = filter.status;
  if (!status || status === "all") return withStatus;
  return withStatus.filter((m) => m.status === status);
}
