/**
 * Builds the idempotency key for an outbound message.
 *
 * Format: "<memberId>:<ruleId|->:<templateKey>:<period>"
 *
 * `period` is the membership end date the message is ABOUT — not the day it was
 * sent. That distinction is the whole point: a retry within the same term
 * produces the same key and is refused, while the member renewing moves
 * `planEnd` and produces a different key, so the next term is eligible again.
 *
 * Without it the key was constant for a member and each template could be sent
 * once in their lifetime — the guard that was meant to stop a retry storm also
 * stopped every legitimate future reminder.
 *
 * The caller passes the stored `planEnd` (a `YYYY-MM-DD` string) and need not
 * pre-normalise: `null` for a member with no end date is sentinel-ed here.
 */
export function buildDedupeKey(input: {
  memberId: string;
  ruleId?: string | null;
  templateKey: string;
  /** The membership end date this message is about. null when there is none. */
  period: string | null;
}): string {
  return [
    input.memberId,
    input.ruleId ?? "-",
    input.templateKey,
    input.period ?? "-",
  ].join(":");
}
