/**
 * Builds the idempotency key for an outbound message.
 *
 * Format: "<memberId>:<ruleId|->:<templateKey>"
 */
export function buildDedupeKey(input: {
  memberId: string;
  ruleId?: string | null;
  templateKey: string;
}): string {
  return [
    input.memberId,
    input.ruleId ?? "-",
    input.templateKey,
  ].join(":");
}
