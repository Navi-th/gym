/**
 * Builds the idempotency key for an outbound message.
 *
 * A retried cron that re-messages every member is how a gym loses its customer
 * base in one afternoon. `messages.dedupe_key` is UNIQUE, so this key is what
 * makes a duplicate send fail loudly at the database level instead of quietly
 * reaching the member a second time.
 *
 * Format: "<memberId>:<subscriptionId|->:<ruleId|->:<templateKey>"
 *
 * The `-` placeholder matters: SQLite treats NULLs as distinct in unique
 * indexes, so nullable ids are normalised to a literal sentinel here, in one
 * place, rather than relying on IFNULL() inside an index expression.
 */
export function buildDedupeKey(input: {
  memberId: string;
  subscriptionId?: string | null;
  ruleId?: string | null;
  templateKey: string;
}): string {
  return [
    input.memberId,
    input.subscriptionId ?? "-",
    input.ruleId ?? "-",
    input.templateKey,
  ].join(":");
}
