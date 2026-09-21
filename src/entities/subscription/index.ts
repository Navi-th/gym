/**
 * Public API of the `subscription` entity slice.
 *
 * A subscription is the record of a member being covered by a plan for a
 * period. It also owns the plan-date PROJECTION on the member row — see the
 * ownership invariant documented in api/assign-plan.ts.
 */

// --- data access -----------------------------------------------------------
export { assignPlan } from "./api/assign-plan";
export { renewSubscription } from "./api/renew-subscription";
export { freezeSubscription } from "./api/freeze-subscription";
export { getSubscriptionById } from "./api/get-subscription-by-id";
export { getActiveSubscription } from "./api/get-active-subscription";
export {
  getSubscriptions,
  type SubscriptionWithMember,
} from "./api/get-subscriptions";

// --- model -----------------------------------------------------------------
export {
  applyFreeze,
  computePeriodEnd,
  computeRenewalPeriod,
  type Period,
} from "./model/expiry";
export {
  DUE_SOON_DAYS,
  deriveSubscriptionState,
  SUBSCRIPTION_STATE_META,
  type SubscriptionState,
} from "./model/state";
export {
  MemberAlreadySubscribedError,
  SubscriptionNotFoundError,
} from "./model/errors";
export type {
  NewSubscription,
  Subscription,
  SubscriptionStatus,
} from "./model/types";
