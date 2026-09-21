import type { subscriptions } from "@/shared/db";

/** Derived from the Drizzle table, so it cannot drift from the schema. */
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type SubscriptionStatus = Subscription["status"];

/**
 * `priceCentsCharged` is the price agreed for the CURRENT period.
 *
 * Renewals EXTEND this row rather than inserting a new one, so this value is
 * updated on each renewal. The amounts actually paid are immutable and live in
 * `payments`, which is the source of truth for revenue history — never
 * re-derive historical revenue from here.
 */
export type SubscriptionPriceBasis = Subscription["priceCentsCharged"];
