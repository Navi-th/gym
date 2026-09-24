/**
 * Member lifecycle status.
 *
 * `stage` in the database holds only MANUAL states (active / frozen).
 * Whether a member is currently active, about to lapse, or already
 * lapsed is DERIVED from `plan_end` — so there is no status column to drift out
 * of sync, and no cron job is needed to flip anyone to "expired" overnight.
 *
 * Dates are compared as UTC calendar dates (YYYY-MM-DD), matching SQLite's
 * `date('now')`. Note that is the UTC day, not the gym's local day: for a gym
 * well ahead of UTC (e.g. IST, +5:30) a member can look expired a few hours
 * early. Pass an explicit `today` when that precision matters.
 */

export const EXPIRING_SOON_DAYS = 7;

export type MemberStage = "active" | "frozen";
export type MemberStatus = MemberStage | "expiring_soon" | "expired";

import { addDays, daysBetween, toDateOnly } from "@/shared/lib";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Resolves the status an admin should actually see.
 *
 * Always prefer this over reading `member.stage` directly — `stage` alone will
 * happily claim "active" for a member whose plan ended last month.
 */
export function deriveMemberStatus(input: {
  stage: MemberStage | string;
  planEnd?: string | null;
  today?: Date;
}): MemberStatus {
  const { stage, planEnd, today = new Date() } = input;

  // Manual states win outright — they are set by a human, not by dates.
  if (stage === "frozen") return "frozen";

  // Reaching here, with no usable end date there is nothing for the date rules
  // to say, so treat as active open-ended membership.
  if (!planEnd || !ISO_DATE.test(planEnd)) return "active";

  const todayOnly = today.toISOString().slice(0, 10);
  const endOnly = toDateOnly(planEnd);

  if (endOnly < todayOnly) return "expired";
  if (endOnly <= addDays(todayOnly, EXPIRING_SOON_DAYS)) return "expiring_soon";
  return "active";
}

/** Days remaining until `planEnd`. Negative means it already lapsed. */
export function daysUntilExpiry(planEnd: string, today: Date = new Date()): number {
  return daysBetween(today.toISOString().slice(0, 10), planEnd);
}

export function computeRenewalDates(input: {
  currentEnd?: string | null;
  status: MemberStatus;
  durationDays: number;
  today: string;
}): { startDate: string; endDate: string } {
  const startDate =
    input.status === "expiring_soon" && input.currentEnd && input.currentEnd >= input.today
      ? input.currentEnd
      : input.today;

  const endDate = addDays(startDate, Math.max(0, input.durationDays - 1));

  return { startDate, endDate };
}

/** Display label + Tailwind tone classes, used by <MemberStatusBadge />. */
export const STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300 font-black",
  },
  expiring_soon: {
    label: "Expiring soon",
    className: "bg-amber-50 text-amber-800 border-amber-300 font-black",
  },
  expired: {
    label: "Expired",
    className: "bg-rose-50 text-rose-700 border-rose-300 font-black",
  },
  frozen: {
    label: "Frozen",
    className: "bg-sky-50 text-sky-700 border-sky-300 font-black",
  },
};

/** Any minimal shape carrying a derived status — keeps these helpers reusable. */
type HasStatus = { status: MemberStatus | string };

/**
 * Tallies members per status.
 *
 * Every key is always present, so callers never have to guard against
 * `undefined` when reading a count off the result.
 */
export function countMembersByStatus(list: HasStatus[]): Record<MemberStatus, number> {
  const counts: Record<MemberStatus, number> = {
    active: 0,
    expiring_soon: 0,
    expired: 0,
    frozen: 0,
  };
  for (const m of list) {
    if (m.status in counts) {
      counts[m.status as MemberStatus] += 1;
    } else {
      counts.active += 1;
    }
  }
  return counts;
}

/**
 * Members that need staff action, most urgent first: anything already lapsed,
 * then whatever lapses soonest.
 */
export function selectRenewalsQueue<T extends HasStatus & { planEnd?: string | null }>(
  list: T[]
): T[] {
  return list
    .filter((m) => m.status === "expiring_soon" || m.status === "expired")
    .sort((a, b) => (a.planEnd ?? "").localeCompare(b.planEnd ?? ""));
}

