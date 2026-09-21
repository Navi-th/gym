import { daysBetween, todayUtc } from "@/shared/lib";
import type { SubscriptionStatus } from "./types";

/**
 * What a subscription actually is right now.
 *
 * The stored `status` column only records deliberate human actions (active,
 * frozen, cancelled). Whether cover has run out is a question about the end
 * date, so — exactly like member status — the answer is derived rather than
 * stored. A row still marked "active" whose end date passed is not cover.
 */
export type SubscriptionState = "active" | "due" | "lapsed" | "frozen" | "cancelled";

/** How many days before expiry the subscription starts being flagged as due. */
export const DUE_SOON_DAYS = 7;

export function deriveSubscriptionState(input: {
  status: SubscriptionStatus;
  endDate: string;
  today?: string;
}): SubscriptionState {
  const { status, endDate, today = todayUtc() } = input;

  // Deliberate human states win over dates.
  if (status === "cancelled") return "cancelled";
  if (status === "frozen") return "frozen";

  const daysLeft = daysBetween(today, endDate);
  if (daysLeft < 0) return "lapsed";
  if (daysLeft <= DUE_SOON_DAYS) return "due";
  return "active";
}

/** Display label + tone classes, used by the subscriptions table. */
export const SUBSCRIPTION_STATE_META: Record<
  SubscriptionState,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300 font-black",
  },
  due: {
    label: "Due soon",
    className: "bg-amber-50 text-amber-800 border-amber-300 font-black",
  },
  lapsed: {
    label: "Lapsed",
    className: "bg-rose-50 text-rose-700 border-rose-300 font-black",
  },
  frozen: {
    label: "Frozen",
    className: "bg-sky-50 text-sky-700 border-sky-300 font-black",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-600 border-zinc-300 font-black",
  },
};
