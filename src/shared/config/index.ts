/**
 * App-wide constants.
 *
 * Anything that would otherwise be duplicated as a literal across layers lives
 * here. `shared` has no slices — only segments — so `shared/lib` may import
 * this file freely.
 */

export const APP_NAME = "PULSE GYM";

/** Single source of truth for currency. Money is stored in minor units. */
export const CURRENCY_SYMBOL = "₹";

/** Locale used for date display. */
export const DATE_LOCALE = "en-GB";
