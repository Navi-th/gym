/**
 * Member lifecycle status.
 *
 * `stage` in the database holds only MANUAL states (lead / active / frozen /
 * churned). Whether a member is currently active, about to lapse, or already
 * lapsed is DERIVED from `plan_end` — so there is no status column to drift out
 * of sync, and no cron job is needed to flip anyone to "expired" overnight.
 *
 * Dates are compared as UTC calendar dates (YYYY-MM-DD), matching SQLite's
 * `date('now')`. Note that is the UTC day, not the gym's local day: for a gym
 * well ahead of UTC (e.g. IST, +5:30) a member can look expired a few hours
 * early. Pass an explicit `today` when that precision matters.
 */

export const EXPIRING_SOON_DAYS = 7;

export type MemberStage = "lead" | "active" | "frozen" | "churned";
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
  stage: MemberStage;
  planEnd?: string | null;
  today?: Date;
}): MemberStatus {
  const { stage, planEnd, today = new Date() } = input;

  // Manual states win outright — they are set by a human, not by dates.
  if (stage === "lead" || stage === "churned" || stage === "frozen") return stage;

  // Reaching here, `stage` is "active". With no usable end date there is
  // nothing for the date rules to say, so honour the explicit stage: an
  // open-ended membership is real.
  //
  // Downgrading it to "lead" would contradict the value a human just
  // deliberately chose. That bug was live until an end-to-end test created a
  // member with stage=active and no plan dates: the API stored "active"
  // while every screen rendered "Lead".
  //
  // Module 5 sets plan_end when a plan is attached, after which the date
  // rules take over.
  if (!planEnd || !ISO_DATE.test(planEnd)) return stage;

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

/** Display label + Tailwind tone classes, used by <MemberStatusBadge />. */
export const STATUS_META: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  expiring_soon: {
    label: "Expiring soon",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  expired: {
    label: "Expired",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  frozen: {
    label: "Frozen",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  lead: {
    label: "Lead",
    className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  churned: {
    label: "Churned",
    className: "bg-slate-700/30 text-slate-400 border-slate-600/40",
  },
};

/** Any minimal shape carrying a derived status — keeps these helpers reusable. */
type HasStatus = { status: MemberStatus };

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
    lead: 0,
    churned: 0,
  };
  for (const m of list) counts[m.status] += 1;
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

