/**
 * Phone number handling.
 *
 * Every number is stored in E.164 (`+919876543210`) because that is what the
 * WhatsApp Cloud API requires. Getting this wrong is the single most common
 * source of "the message never arrived" bugs, so normalisation happens in one
 * place, on the way in, rather than being re-guessed at send time.
 */

/** Indian mobile numbers are the default — this is a single-country gym. */
export const DEFAULT_COUNTRY_CODE = "+91";

const E164_DIGITS = /^\d{8,15}$/;

/**
 * Normalises a human-typed number to E.164, or returns null if it cannot be.
 *
 *     "98765 43210"     -> "+919876543210"
 *     "098765-43210"    -> "+919876543210"   (trunk 0 stripped)
 *     "0091 98765 43210"-> "+919876543210"   (00 international prefix)
 *     "+1 415 555 1234" -> "+14155551234"    (explicit code respected)
 *     "123"             -> null              (too short)
 *
 * CAVEAT: a bare 10-digit number is assumed to be local and gets the default
 * country code. "4155551234" therefore becomes +914155551234, not +14155551234.
 * That is correct for a single-country gym and wrong for an international one;
 * require the + prefix if that ever changes.
 */
export function normalisePhone(
  raw: string,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE
): string | null {
  if (!raw) return null;

  // Strip spaces, dashes, dots and brackets — but keep a leading +.
  let value = raw.trim().replace(/[^\d+]/g, "");
  if (!value) return null;

  // 00 is the international access prefix in much of the world.
  if (value.startsWith("00")) value = `+${value.slice(2)}`;

  // An explicit country code is authoritative — never override it.
  if (value.startsWith("+")) {
    const digits = value.slice(1).replace(/\D/g, "");
    return E164_DIGITS.test(digits) ? `+${digits}` : null;
  }

  // No country code: strip any trunk prefix, then apply the default.
  const national = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!national) return null;

  const countryCode = defaultCountryCode.replace(/\D/g, "");
  const combined = `${countryCode}${national}`;
  return E164_DIGITS.test(combined) ? `+${combined}` : null;
}

/**
 * Renders a stored E.164 number for a human.
 *
 *     "+919876543210" -> "+91 98765 43210"
 *
 * Unknown country codes are returned unchanged rather than mangled — a
 * half-guessed format is worse than the raw value.
 */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "—";
  const indian = e164.match(/^\+91(\d{5})(\d{5})$/);
  if (indian) return `+91 ${indian[1]} ${indian[2]}`;
  return e164;
}
