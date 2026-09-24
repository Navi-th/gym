/**
 * Currency parsing for plan prices.
 *
 * Money is stored as integer minor units everywhere. The conversion from what
 * a human types to what the database holds happens HERE and nowhere else.
 *
 * Parsed from the STRING, not from a float. `Math.round(Number("1.005") * 100)`
 * is 100, not 101, because 1.005 has no exact binary representation — the kind
 * of error that quietly undercharges someone. Splitting on the decimal point
 * and padding the fraction keeps every digit the user typed.
 */

/** "₹69.99" | "69.99" | "69" | "1,188.00" -> 6999 / 6999 / 6900 / 118800 */
export function parsePriceToCents(input: string): number | null {
  if (typeof input !== "string") return null;

  const cleaned = input.trim().replace(/[₹$€£,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [whole, fraction = ""] = cleaned.split(".");
  const cents = fraction.padEnd(2, "0");
  return Number(whole) * 100 + Number(cents);
}

/** 90000 -> "900" — for prefilling a price input in Rupees. */
export function centsToPriceInput(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100);
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

/**
 * Upper bound on a plan's length, so a typo cannot create a 90-year plan.
 *
 * Plan-specific, so it stays here. The money bound is NOT here — see
 * MAX_MONEY_CENTS in shared/config, which the payment entity also needs.
 */
export const MAX_DURATION_DAYS = 1095; // 3 years
