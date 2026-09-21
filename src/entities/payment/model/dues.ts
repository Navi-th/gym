/**
 * Who owes money.
 *
 * Deliberately simple and deliberately late-only: a member is in arrears when
 * their cover has already run out. Members expiring in a few days are not
 * "owing" anything — they are being reminded, which is a different job with a
 * different message. Conflating the two produces a list that is either
 * panickingly long or uselessly short.
 *
 * Generic over the row shape rather than importing the member type, because
 * entities on the same layer may not import each other; all it needs is a
 * `planEnd`.
 */

export type HasPlanEnd = { planEnd: string | null };

/** True when cover has already ended as of `today`. */
export function isOverdue(person: HasPlanEnd, today: string): boolean {
  return person.planEnd !== null && person.planEnd < today;
}

/** Whole days since cover ended. Negative when cover is still running. */
export function daysOverdue(planEnd: string, today: string): number {
  const end = Date.parse(`${planEnd}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  return Math.round((now - end) / 86_400_000);
}

/**
 * Everyone in arrears, longest-lapsed first.
 *
 * Sorted by how long they have been gone rather than alphabetically, because
 * the member who lapsed three months ago needs a different conversation from
 * the one who lapsed yesterday.
 */
export function selectDues<T extends HasPlanEnd>(people: T[], today: string): T[] {
  return people
    .filter((person) => isOverdue(person, today))
    .sort((a, b) => (a.planEnd ?? "").localeCompare(b.planEnd ?? ""));
}
