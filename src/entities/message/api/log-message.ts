import { getDb, messages as messagesTable } from "@/shared/db";
import { isUniqueConstraintError, newId } from "@/shared/lib";
import { buildDedupeKey } from "../model/dedupe";
import { DuplicateMessageError } from "../model/errors";
import type { Message, MessageStatus } from "../model/types";

export type LogMessageInput = {
  memberId: string;
  ruleId?: string | null;
  templateKey: string;
  /** The membership end date this message is about. null when there is none. */
  period: string | null;
  toPhone: string;
  /** null for a `skipped` row — nothing was sent, so there is no body to dispute. */
  renderedBody: string | null;
  channel?: string;
  /**
   * Required, and deliberately NOT defaulted. A default of "sent" is exactly how
   * this ledger came to claim messages that were never handed to WhatsApp.
   */
  status: MessageStatus;
};

export async function logMessage(input: LogMessageInput): Promise<Message> {
  const db = getDb();

  const dedupeKey = buildDedupeKey({
    memberId: input.memberId,
    ruleId: input.ruleId,
    templateKey: input.templateKey,
    period: input.period,
  });

  try {
    const rows = await db
      .insert(messagesTable)
      .values({
        id: newId(),
        memberId: input.memberId,
        ruleId: input.ruleId ?? null,
        templateKey: input.templateKey,
        dedupeKey,
        toPhone: input.toPhone,
        channel: input.channel ?? "whatsapp",
        status: input.status,
        renderedBody: input.renderedBody,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return rows[0];
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DuplicateMessageError(dedupeKey);
    }
    throw error;
  }
}
