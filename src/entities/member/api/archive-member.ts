import { and, eq, isNull } from "drizzle-orm";
import { getDb, members as membersTable } from "@/shared/db";
import type { Member } from "../model/types";

/**
 * Archives a member by setting `deleted_at`.
 *
 * Soft delete, never a real DELETE: a member's payment and subscription
 * history has to survive them leaving, both for accounting and so that
 * re-adding them later does not orphan those rows.
 *
 * Returns null if they were already archived (or never existed).
 */
export async function archiveMember(id: string): Promise<Member | null> {
  const db = getDb();
  const now = new Date().toISOString();

  const rows = await db
    .update(membersTable)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(membersTable.id, id), isNull(membersTable.deletedAt)))
    .returning();

  return rows[0] ?? null;
}
