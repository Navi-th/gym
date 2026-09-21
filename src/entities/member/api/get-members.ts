import { getDb, members as membersTable } from "@/shared/db";
import { deriveMemberStatus, daysUntilExpiry, type MemberStatus } from "../model/status";
import type { Member } from "../model/types";

/** A member with its DERIVED status attached, ready for display. */
export type MemberWithStatus = Member & {
  status: MemberStatus;
  /** null when the member has no plan end date (e.g. a lead). */
  daysLeft: number | null;
};

/**
 * All non-archived members, each with its derived status.
 *
 * Always prefer this over reading `member.stage` directly: `stage` holds only
 * manual states, so it will happily report "active" for someone whose plan
 * lapsed last month.
 */
export async function getMembers(): Promise<MemberWithStatus[]> {
  const db = getDb();
  const rows = await db.select().from(membersTable);

  return rows
    .filter((m) => !m.deletedAt)
    .map((m) => ({
      ...m,
      status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd }),
      daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd) : null,
    }));
}
