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

/**
 * Upper bound on any single money amount.
 *
 * Lives in shared because BOTH the plan and payment entities need it, and two
 * entity slices may not import each other. It exists only to catch a misplaced
 * decimal point before it becomes a six-figure charge.
 */
export const MAX_MONEY_CENTS = 10_000_000; // 100,000.00

// Note: there is deliberately no locale/format constant here. Date display is
// built from a fixed month table in shared/lib/format.ts so that server and
// client always agree (see formatDate).
