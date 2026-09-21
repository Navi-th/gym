import { and, eq, isNull } from "drizzle-orm";
import { getDb, members as membersTable } from "@/shared/db";
import { DuplicatePhoneError } from "../model/errors";

/**
 * Guards against two live members sharing a phone number.
 *
 * Why an application check rather than a UNIQUE constraint: the constraint we
 * actually want is *partial* — unique among rows where `deleted_at IS NULL` -
 * so that archiving a member frees their number for reuse. SQLite supports
 * partial indexes, but drizzle-kit could not express one here, and a plain
 * UNIQUE on phone would permanently block re-adding an archived member.
 *
 * KNOWN LIMIT: check-then-insert is racy in principle. In practice D1 is
 * single-writer per database and staff add members one at a time. If that ever
 * stops being true, add the partial index via raw SQL in a migration and keep
 * this check for the friendly error message.
 */
export async function assertPhoneIsFree(
  phone: string,
  ignoreMemberId?: string
): Promise<void> {
  const db = getDb();

  const rows = await db
    .select({ id: membersTable.id })
    .from(membersTable)
    .where(and(eq(membersTable.phone, phone), isNull(membersTable.deletedAt)))
    .limit(1);

  const existing = rows[0];
  if (existing && existing.id !== ignoreMemberId) {
    throw new DuplicatePhoneError(phone);
  }
}
