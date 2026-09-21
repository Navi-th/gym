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

// Note: there is deliberately no locale/format constant here. Date display is
// built from a fixed month table in shared/lib/format.ts so that server and
// client always agree (see formatDate).
