import { describe, expect, it } from "vitest";
import { validatePlanInput } from "./validate";

const VALID = {
  name: "Pro Athlete Pass",
  priceCents: 6900,
  billingPeriod: "monthly" as const,
  durationDays: 30,
};

function errorsOf(input: Parameters<typeof validatePlanInput>[0]) {
  const result = validatePlanInput(input);
  if (result.ok) throw new Error("expected validation to fail, but it passed");
  return result.errors;
}
function valueOf(input: Parameters<typeof validatePlanInput>[0]) {
  const result = validatePlanInput(input);
  if (!result.ok) throw new Error(`expected pass: ${JSON.stringify(result.errors)}`);
  return result.value;
}

describe("validatePlanInput - acceptance", () => {
  it("accepts a well-formed plan", () => {
    const value = valueOf(VALID);
    expect(value.name).toBe("Pro Athlete Pass");
    expect(value.priceCents).toBe(6900);
  });

  it("trims the name", () => {
    expect(valueOf({ ...VALID, name: "  Pro  " }).name).toBe("Pro");
  });

  it("defaults new plans to available", () => {
    expect(valueOf(VALID).isActive).toBe(true);
  });

  it("allows a free plan, because a trial is a real product", () => {
    expect(valueOf({ ...VALID, priceCents: 0 }).priceCents).toBe(0);
  });

  it("accepts both billing periods", () => {
    expect(valueOf({ ...VALID, billingPeriod: "annual", durationDays: 365 }).billingPeriod).toBe("annual");
  });
});

describe("validatePlanInput - rejection", () => {
  it("requires a name", () => {
    expect(errorsOf({ ...VALID, name: "" }).name).toBeDefined();
    expect(errorsOf({}).name).toBeDefined();
  });

  it("bounds the name length", () => {
    expect(errorsOf({ ...VALID, name: "A" }).name).toMatch(/at least 2/);
    expect(errorsOf({ ...VALID, name: "x".repeat(61) }).name).toMatch(/under 60/);
  });

  it("requires a numeric price", () => {
    expect(errorsOf({ ...VALID, priceCents: undefined }).priceCents).toBeDefined();
    expect(errorsOf({ ...VALID, priceCents: NaN }).priceCents).toBeDefined();
  });

  it("rejects a fractional price, which would mean rupees not paise", () => {
    // Someone posting { priceCents: 69 } instead of 6900 would charge 100x
    // less; a float like 69.5 would silently truncate. Both are refused.
    expect(errorsOf({ ...VALID, priceCents: 69.5 }).priceCents).toMatch(/whole number/i);
  });

  it("rejects a negative price", () => {
    expect(errorsOf({ ...VALID, priceCents: -100 }).priceCents).toMatch(/negative/i);
  });

  it("rejects an implausibly large price", () => {
    expect(errorsOf({ ...VALID, priceCents: 999_999_999 }).priceCents).toMatch(/too large/i);
  });

  it("rejects an unknown billing period", () => {
    expect(errorsOf({ ...VALID, billingPeriod: "weekly" as never }).billingPeriod).toBeDefined();
  });

  it("requires a whole-number duration inside sane bounds", () => {
    expect(errorsOf({ ...VALID, durationDays: 0 }).durationDays).toMatch(/at least 1/);
    expect(errorsOf({ ...VALID, durationDays: -30 }).durationDays).toBeDefined();
    expect(errorsOf({ ...VALID, durationDays: 30.5 }).durationDays).toMatch(/whole number/i);
    expect(errorsOf({ ...VALID, durationDays: 5000 }).durationDays).toMatch(/1095/);
  });

  it("reports every problem at once", () => {
    const errors = errorsOf({ name: "", priceCents: -1, billingPeriod: "x" as never, durationDays: 0 });
    expect(Object.keys(errors).sort()).toEqual([
      "billingPeriod",
      "durationDays",
      "name",
      "priceCents",
    ]);
  });
});
