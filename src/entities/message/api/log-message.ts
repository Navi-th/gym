import { getDb, messages as messagesTable } from "@/shared/db";
import { isUniqueConstraintError, newId } from "@/shared/lib";
import { buildDedupeKey } from "../model/dedupe";
import { DuplicateMessageError } from "../model/errors";
import type { Message, MessageStatus } from "../model/types";

export type LogMessageInput = {
  memberId: string;
  subscriptionId?: string | null;
  ruleId?: string | null;
  templateKey: string;
  toPhone: string;
  renderedBody: string;
  channel?: string;
  status?: MessageStatus;
};

/**
 * Records an outbound message in the ledger.
 *
 * The dedupe_key is UNIQUE, so a duplicate returns DuplicateMessageError
 * instead of quietly writing a second row. That is the difference between a
 * retried job and a customer receiving the same reminder twice — and it is
 * enforced by the database rather than by remembering to check.
 *
 * `rendered_body` is stored verbatim: when a member says "you told me X", the
 * exact wording that went out is the only defensible answer.
 */
export async function logMessage(input: LogMessageInput): Promise<Message> {
  const db = getDb();

  const dedupeKey = buildDedupeKey({
    memberId: input.memberId,
    subscriptionId: input.subscriptionId,
    ruleId: input.ruleId,
    templateKey: input.templateKey,
  });

  try {
    const rows = await db
      .insert(messagesTable)
      .values({
        id: newId(),
        memberId: input.memberId,
        subscriptionId: input.subscriptionId ?? null,
        ruleId: input.ruleId ?? null,
        templateKey: input.templateKey,
        dedupeKey,
        toPhone: input.toPhone,
        channel: input.channel ?? "whatsapp",
        status: input.status ?? "sent",
        renderedBody: input.renderedBody,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return rows[0];
  } catch (error) {
    // isUniqueConstraintError walks the cause chain. Checking error.message
    // directly does NOT work here: Drizzle wraps the driver error, so the
    // top-level message is just "Failed query: insert into ...". That mistake
    // turned this guard into an opaque 500 until an e2e test caught it.
    //
    // Matching on the constraint also keeps this honest - only a duplicate is
    // reported as one, rather than swallowing every insert failure.
    if (isUniqueConstraintError(error)) {
      throw new DuplicateMessageError(dedupeKey);
    }
    throw error;
  }
}
