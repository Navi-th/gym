import { MAX_MONEY_CENTS } from "@/shared/config";
import { MAX_DURATION_DAYS } from "./price";

/**
 * Plan input validation.
 *
 * NOTE ON EDITS: changing a plan's `durationDays` affects only FUTURE
 * assignments. Existing subscriptions already snapshotted their own start and
 * end dates, so nothing here may ever reach back and rewrite them — see the
 * ownership invariant in entities/subscription/api/assign-plan.ts.
 */

export type PlanInput = {
  name: string;
  priceCents: number;
  billingPeriod: "monthly" | "annual";
  durationDays: number;
  isActive: boolean;
};

export type PlanValidationResult =
  | { ok: true; value: PlanInput }
  | { ok: false; errors: Record<string, string> };

const PERIODS: PlanInput["billingPeriod"][] = ["monthly", "annual"];

export function validatePlanInput(raw: Partial<PlanInput>): PlanValidationResult {
  const errors: Record<string, string> = {};

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) {
    errors.name = "Plan name is required.";
  } else if (name.length < 2) {
    errors.name = "Plan name must be at least 2 characters.";
  } else if (name.length > 60) {
    errors.name = "Plan name must be under 60 characters.";
  }

  const priceCents = raw.priceCents;
  if (typeof priceCents !== "number" || !Number.isFinite(priceCents)) {
    errors.priceCents = "Price is required.";
  } else if (!Number.isInteger(priceCents)) {
    // Money is minor units. A fractional value here means someone bypassed the
    // form and sent rupees, which would overcharge by 100x.
    errors.priceCents = "Price must be a whole number of minor units (cents).";
  } else if (priceCents < 0) {
    errors.priceCents = "Price cannot be negative.";
  } else if (priceCents > MAX_MONEY_CENTS) {
    errors.priceCents = "Price looks too large — check for a misplaced decimal point.";
  }

  const billingPeriod = raw.billingPeriod;
  if (!billingPeriod || !PERIODS.includes(billingPeriod)) {
    errors.billingPeriod = `Billing period must be one of: ${PERIODS.join(", ")}.`;
  }

  const durationDays = raw.durationDays;
  if (typeof durationDays !== "number" || !Number.isInteger(durationDays)) {
    errors.durationDays = "Duration must be a whole number of days.";
  } else if (durationDays < 1) {
    errors.durationDays = "Duration must be at least 1 day.";
  } else if (durationDays > MAX_DURATION_DAYS) {
    errors.durationDays = `Duration must be ${MAX_DURATION_DAYS} days or fewer.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      priceCents: priceCents as number,
      billingPeriod: billingPeriod as PlanInput["billingPeriod"],
      durationDays: durationDays as number,
      // Defaults to available: a plan is created to be sold, and retiring is a
      // separate, deliberate action.
      isActive: raw.isActive ?? true,
    },
  };
}
