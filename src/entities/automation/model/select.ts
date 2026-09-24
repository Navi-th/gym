import { daysBetween, isIsoDate } from "@/shared/lib";

/**
 * Automation rule selection — which members a rule applies to today.
 *
 * Pure and generic over the row shape rather than importing the member type,
 * because two entity slices may not import each other under FSD (see
 * scripts/check-fsd-layers.mjs). All the engine needs is `planEnd`, `stage` and
 * `deletedAt` — the same technique entities/payment/model/dues.ts uses.
 */

/**
 * Triggers this engine can actually act on.
 *
 * `payment_due` does the overdue job, not `payment_overdue`. There is no invoice
 * or due-date anywhere in the schema, so "this payment is due" can only be
 * computed from cover having already run out — which is exactly what
 * `payment_due`'s seeded rule and message do. `payment_overdue` and `welcome`
 * stay unwired, and the UI says so rather than showing an empty list that looks
 * like a bug.
 */
export const WIRED_TRIGGERS = ["plan_expiring", "payment_due"] as const;

export type WiredTrigger = (typeof WIRED_TRIGGERS)[number];

export function isWiredTrigger(trigger: string): trigger is WiredTrigger {
  return (WIRED_TRIGGERS as readonly string[]).includes(trigger);
}

/** The minimum a row must carry to be judged by a rule. */
export type RuleCandidate = {
  planEnd: string | null;
  stage: string;
  deletedAt?: string | null;
};

/**
 * Members a rule applies to as of `today`.
 *
 * `plan_expiring` matches a WINDOW (`0 <= daysLeft <= offsetDays`), not one exact
 * day. That is deliberate: a missed run costs nothing, because whoever looks next
 * picks the member up — and the dedupe key carries the membership term, so a
 * second message for the same term is structurally impossible. An exact-day rule
 * would silently drop everyone on any day nobody looked.
 *
 * Excluded, deliberately:
 *  - soft-deleted members, who are gone as far as the gym is concerned
 *  - frozen members, whose cover is paused — reminding them is simply wrong
 *  - members with no usable end date, leaving nothing to compute from
 */
export function selectDueForRule<T extends RuleCandidate>(input: {
  trigger: string;
  offsetDays: number;
  people: T[];
  today: string;
}): T[] {
  const { trigger, offsetDays, people, today } = input;

  if (!isWiredTrigger(trigger)) return [];

  return people.filter((person) => {
    if (person.deletedAt) return false;
    if (person.stage === "frozen") return false;
    if (!person.planEnd || !isIsoDate(person.planEnd)) return false;

    const daysLeft = daysBetween(today, person.planEnd);

    if (trigger === "plan_expiring") {
      return daysLeft >= 0 && daysLeft <= offsetDays;
    }

    // payment_due: cover has already ended, so money is owed.
    return daysLeft < 0;
  });
}
