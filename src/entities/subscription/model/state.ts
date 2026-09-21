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
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  due: {
    label: "Due soon",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  lapsed: {
    label: "Lapsed",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  frozen: {
    label: "Frozen",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-700/30 text-slate-400 border-slate-600/40",
  },
};
