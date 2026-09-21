import type { subscriptions } from "@/shared/db";

/** Derived from the Drizzle table, so it cannot drift from the schema. */
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

/**
 * `priceCentsCharged` is a SNAPSHOT taken when the subscription was created.
 * Never recompute historical revenue from the live plan price — plans change,
 * and the past must not re-price itself.
 */
export type SubscriptionStatus = Subscription["status"];
