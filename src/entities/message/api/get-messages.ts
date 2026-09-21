import { desc, eq } from "drizzle-orm";
import { getDb, members as membersTable, messages as messagesTable } from "@/shared/db";
import type { Message } from "../model/types";

export type MessageWithMember = Message & {
  memberName: string;
  memberCode: string;
};

/** The outbound ledger, newest first. */
export async function getMessages(
  options: { limit?: number } = {}
): Promise<MessageWithMember[]> {
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

  const rows = options.limit ? await query.limit(options.limit) : await query;

  return rows.map((row) => ({
    ...row.message,
    memberName: row.memberName,
    memberCode: row.memberCode,
  }));
}

/** Keys already sent to a member, so the UI can avoid re-offering them. */
export async function getSentTemplateKeys(memberId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ templateKey: messagesTable.templateKey })
    .from(messagesTable)
    .where(eq(messagesTable.memberId, memberId));

  return rows.map((r) => r.templateKey);
}
