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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Normalises any ISO timestamp to its UTC calendar date (YYYY-MM-DD). */
export function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Adds days to a YYYY-MM-DD string using UTC arithmetic. */
export function addDays(dateOnly: string, days: number): string {
  const d = new Date(`${toDateOnly(dateOnly)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${toDateOnly(from)}T00:00:00Z`);
  const b = Date.parse(`${toDateOnly(to)}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

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

  // Active stage but no end date is not a real state; treat it as a lead.
  if (!planEnd || !ISO_DATE.test(planEnd)) return "lead";

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

/** Display label + Tailwind tone classes, used by <StatusBadge />. */
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
