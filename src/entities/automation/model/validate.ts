/**
 * Automation rule input validation.
 *
 * The template key's EXISTENCE is checked in the route handler, which has
 * database access. This only guards the shape, which keeps the rules pure and
 * testable without a database.
 */

/**
 * Ceiling on the offset.
 *
 * A "reminder" further out than a quarter is not a reminder, and a large offset
 * would drag most of the member list into the queue at once.
 */
export const MAX_OFFSET_DAYS = 90;

export type RuleInput = {
  name: string;
  offsetDays: number;
  templateKey: string;
  isEnabled: boolean;
};

export type RuleValidationResult =
  | { ok: true; value: RuleInput }
  | { ok: false; errors: Record<string, string> };

export function validateRuleInput(raw: Partial<RuleInput>): RuleValidationResult {
  const errors: Record<string, string> = {};

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) {
    errors.name = "Rule name is required.";
  } else if (name.length > 100) {
    errors.name = "Rule name must be under 100 characters.";
  }

  const offsetDays = raw.offsetDays;
  if (typeof offsetDays !== "number" || !Number.isInteger(offsetDays)) {
    errors.offsetDays = "Days must be a whole number.";
  } else if (offsetDays < 0) {
    errors.offsetDays = "Days cannot be negative.";
  } else if (offsetDays > MAX_OFFSET_DAYS) {
    errors.offsetDays = `Days must be ${MAX_OFFSET_DAYS} or fewer.`;
  }

  const templateKey = typeof raw.templateKey === "string" ? raw.templateKey.trim() : "";
  if (!templateKey) {
    errors.templateKey = "A message template is required.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      offsetDays: offsetDays as number,
      templateKey,
      // Off when unset: a missing toggle must never turn a rule on by accident.
      isEnabled: raw.isEnabled ?? false,
    },
  };
}
