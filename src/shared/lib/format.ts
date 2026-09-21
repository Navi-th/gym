import { CURRENCY_SYMBOL, DATE_LOCALE } from "@/shared/config";

/**
 * Formatting helpers.
 *
 * Money is stored throughout the database as integer minor units (cents) so
 * arithmetic stays exact. It is converted to a display string only here, at the
 * edge of the UI — never the other way round.
 */

/** 6900 -> "₹69.00" */
export function formatMoney(cents: number, currency = CURRENCY_SYMBOL): string {
  return `${currency}${(cents / 100).toFixed(2)}`;
}

/** 6900 -> "₹69" (drops .00 for compact table cells and KPI tiles) */
export function formatMoneyCompact(cents: number, currency = CURRENCY_SYMBOL): string {
  const value = cents / 100;
  return `${currency}${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

/** "2026-09-26" or an ISO timestamp -> "26 Sep 2026" */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
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
