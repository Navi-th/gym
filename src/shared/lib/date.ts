/**
 * Date helpers for calendar dates stored as ISO `YYYY-MM-DD` text.
 *
 * These live in `shared` rather than in an entity because more than one entity
 * needs them: members expire, subscriptions expire, and two entity slices may
 * not import each other under FSD. They know nothing about members or plans.
 *
 * Everything is computed in UTC to match SQLite's `date('now')`, and to keep
 * the result identical whatever timezone the server happens to run in.
 */

/** Normalises any ISO date or timestamp to its UTC calendar date. */
export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Adds days to a `YYYY-MM-DD` string, crossing months and years correctly. */
export function addDays(dateOnly: string, days: number): string {
  const d = new Date(`${toDateOnly(dateOnly)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${toDateOnly(from)}T00:00:00Z`);
  const b = Date.parse(`${toDateOnly(to)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Today as a UTC calendar date. Isolated so tests and callers can pin it. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** True when `value` looks like a `YYYY-MM-DD` date (or a timestamp starting with one). */
export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}
