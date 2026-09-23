import { getDb, messages as messagesTable } from "@/shared/db";
import { isUniqueConstraintError, newId } from "@/shared/lib";
import { buildDedupeKey } from "../model/dedupe";
import { DuplicateMessageError } from "../model/errors";
import type { Message, MessageStatus } from "../model/types";

export type LogMessageInput = {
  memberId: string;
  ruleId?: string | null;
  templateKey: string;
  toPhone: string;
  renderedBody: string;
  channel?: string;
  status?: MessageStatus;
};

export async function logMessage(input: LogMessageInput): Promise<Message> {
  const db = getDb();

  const dedupeKey = buildDedupeKey({
    memberId: input.memberId,
    ruleId: input.ruleId,
    templateKey: input.templateKey,
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
        status: input.status ?? "sent",
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
