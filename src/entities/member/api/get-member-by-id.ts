import { cache } from "react";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, members as membersTable, plans as plansTable } from "@/shared/db";
import { daysUntilExpiry, deriveMemberStatus } from "../model/status";
import type { MemberWithStatus } from "./get-members";

/** A single non-archived member with derived status, or null if not found. */
export const getMemberById = cache(async function getMemberById(
  id: string
): Promise<MemberWithStatus | null> {
  const db = getDb();

  const rows = await db
    .select({
      member: membersTable,
      planName: plansTable.name,
    })
    .from(membersTable)
    .leftJoin(plansTable, eq(membersTable.planId, plansTable.id))
    .where(and(eq(membersTable.id, id), isNull(membersTable.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const { member, planName } = row;

  return {
    ...member,
    status: deriveMemberStatus({ stage: member.stage, planEnd: member.planEnd }),
    daysLeft: member.planEnd ? daysUntilExpiry(member.planEnd) : null,
    planName: planName ?? null,
  };
});

