import { cache } from "react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, members as membersTable, messages as messagesTable } from "@/shared/db";
import type { Message, MessageStatus } from "../model/types";

export type MessageWithMember = Message & {
  memberName: string;
  memberCode: string;
};

const getMessagesCached = cache(
  async (limit: number | null): Promise<MessageWithMember[]> => {
    const db = getDb();

    const query = db
      .select({
        message: messagesTable,
        memberName: membersTable.fullName,
        memberCode: membersTable.memberCode,
      })
      .from(messagesTable)
      .innerJoin(membersTable, eq(messagesTable.memberId, membersTable.id))
      .orderBy(desc(messagesTable.createdAt));

    const rows = limit ? await query.limit(limit) : await query;

    return rows.map((row) => ({
      ...row.message,
      memberName: row.memberName,
      memberCode: row.memberCode,
    }));
  }
);

/** The outbound ledger, newest first. */
export async function getMessages(
  options: { limit?: number } = {}
): Promise<MessageWithMember[]> {
  return getMessagesCached(options.limit ?? null);
}

/**
 * Statuses that mean "already dealt with for this term".
 *
 * `failed` is deliberately absent: a failed attempt must stay retryable, so it
 * neither blocks the member from reappearing nor stops a later commit.
 */
const HANDLED_STATUSES: MessageStatus[] = ["sent", "skipped", "delivered", "read"];

/**
 * Bound parameters per query. SQLite caps how many a single statement may bind,
 * and a gym with a few thousand members would blow that with one `IN` clause
 * holding an id each.
 */
const MEMBER_ID_BATCH = 400;

/**
 * Dedupe keys already handled, for the members currently in the queue.
 *
 * Returns keys rather than rows because the caller holds the member, rule and
 * period and can rebuild the key with `buildDedupeKey` — there is nothing to map
 * back to a row. Scoped to the given members so a gym that has been running for
 * years does not load its entire message history to render one page.
 *
 * Not wrapped in `cache()` like its neighbours: the argument is an array, so
 * React would memoise on identity and re-query on every render anyway.
 */
export async function getBlockedDedupeKeys(memberIds: string[]): Promise<string[]> {
  if (memberIds.length === 0) return [];

  const db = getDb();
  const keys: string[] = [];

  for (let start = 0; start < memberIds.length; start += MEMBER_ID_BATCH) {
    const batch = memberIds.slice(start, start + MEMBER_ID_BATCH);
    const rows = await db
      .select({ dedupeKey: messagesTable.dedupeKey })
      .from(messagesTable)
      .where(
        and(
          inArray(messagesTable.memberId, batch),
          inArray(messagesTable.status, HANDLED_STATUSES)
        )
      );

    for (const row of rows) keys.push(row.dedupeKey);
  }

  return keys;
}

