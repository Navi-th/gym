import { and, eq, isNull } from "drizzle-orm";
import { getDb, members as membersTable } from "@/shared/db";
import { daysUntilExpiry, deriveMemberStatus } from "../model/status";
import type { MemberWithStatus } from "./get-members";

/** A single non-archived member with derived status, or null if not found. */
export async function getMemberById(id: string): Promise<MemberWithStatus | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.id, id), isNull(membersTable.deletedAt)))
    .limit(1);

  const member = rows[0];
  if (!member) return null;

  return {
    ...member,
    status: deriveMemberStatus({ stage: member.stage, planEnd: member.planEnd }),
    daysLeft: member.planEnd ? daysUntilExpiry(member.planEnd) : null,
  };
}
