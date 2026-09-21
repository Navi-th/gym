/**
 * Unique id generation for database rows.
 *
 * `crypto.randomUUID` is available both on Cloudflare Workers and in Node 18+,
 * so this needs no dependency (no nanoid, no uuid package).
 */
export function newId(): string {
  return crypto.randomUUID();
}
