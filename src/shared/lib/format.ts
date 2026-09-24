import { CURRENCY_SYMBOL } from "@/shared/config";

/**
 * Formatting helpers.
 *
 * Money is stored throughout the database as integer minor units (cents) so
 * arithmetic stays exact. It is converted to a display string only here, at the
 * edge of the UI — never the other way round.
 */

/** 90000 -> "₹900", 240000 -> "₹2,400" */
export function formatMoney(cents: number, currency = CURRENCY_SYMBOL): string {
  const value = cents / 100;
  return `${currency}${Number.isInteger(value) ? value.toLocaleString("en-IN") : value.toFixed(2)}`;
}

/** 90000 -> "₹900" (compact formatting for table cells and KPI tiles) */
export function formatMoneyCompact(cents: number, currency = CURRENCY_SYMBOL): string {
  const value = cents / 100;
  return `${currency}${Number.isInteger(value) ? value.toLocaleString("en-IN") : value.toFixed(2)}`;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "2026-09-26" or an ISO timestamp -> "26 Sep 2026"
 *
 * Deliberately NOT `toLocaleDateString`. Locale data varies by ICU version and
 * by runtime: under current CLDR, en-GB renders September as "Sept", while
 * older ICU and most browsers render "Sep". For a server-rendered app that is
 * a real hazard — the same date can differ between the server that rendered it
 * and the browser that hydrated it, and snapshot-style tests fail on machines
 * with different ICU builds. A fixed month table costs six lines and makes the
 * output identical everywhere.
 *
 * Also validates the shape rather than trusting `new Date()`, which happily
 * accepts nonsense and silently produces Invalid Date.
 */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "—";

  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return "—";

  return `${day} ${MONTHS_SHORT[monthIndex]} ${year}`;
}

/** "2026-09-26" -> "in 5 days" / "3 days ago" / "today" */
export function formatRelativeDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/** Pulls initials for avatars: "Test Member One" -> "TM" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
