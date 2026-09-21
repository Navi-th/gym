/**
 * Public API of the `subscription` entity slice.
 *
 * Queries arrive with module 5 (subscriptions) — the slice exists now so the
 * layer boundary is in place from the start.
 */
export type {
  NewSubscription,
  Subscription,
  SubscriptionStatus,
} from "./model/types";
