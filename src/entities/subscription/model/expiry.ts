import { addDays } from "@/shared/lib";

/**
 * Subscription period arithmetic.
 *
 * THE ONE DECISION THAT MATTERS: what `end_date` means.
 *
 * It is the **last day of cover**, not the first day after it. A 30-day plan
 * starting 1 Sept therefore has `end_date` 30 Sept, and the member is expired
 * on 1 Oct.
 *
 * This is the classic membership off-by-one. Get it wrong in one direction and
 * members are told they expired a day early; in the other, they are let in for
 * a day they did not pay for. Either way nobody can explain why, because the
 * bug lives at a boundary that only shows up on one day out of thirty.
 */

export type Period = { startDate: string; endDate: string };

/** Last day of cover for a period beginning on `startDate`. */
export function computePeriodEnd(startDate: string, durationDays: number): string {
  if (durationDays < 1) {
    throw new RangeError(`durationDays must be at least 1, received ${durationDays}`);
  }
  // A 1-day plan covers exactly its start date.
  return addDays(startDate, durationDays - 1);
}

/**
 * The period a renewal buys.
 *
 * If cover is still running, the new period begins the day AFTER it ends, so
 * renewing early never costs the member days they already paid for. If cover
 * has already lapsed, the new period begins today — we do not backdate a
 * renewal, because that would charge them for time they did not use.
 */
export function computeRenewalPeriod(input: {
  currentEnd: string | null | undefined;
  today: string;
  durationDays: number;
}): Period {
  const { currentEnd, today, durationDays } = input;

  const stillCovered = Boolean(currentEnd) && (currentEnd as string) >= today;
  const startDate = stillCovered ? addDays(currentEnd as string, 1) : today;

  return { startDate, endDate: computePeriodEnd(startDate, durationDays) };
}

/**
 * Pushes cover out by a freeze.
 *
 * Freezing pauses membership rather than ending it, so the days frozen are
 * added to the end. `freezeDays` accumulates across repeated freezes.
 */
export function applyFreeze(input: {
  endDate: string;
  additionalFreezeDays: number;
}): string {
  const { endDate, additionalFreezeDays } = input;
  if (additionalFreezeDays <= 0) return endDate;
  return addDays(endDate, additionalFreezeDays);
}
