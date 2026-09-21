import { describe, expect, it } from "vitest";
import { applyFreeze, computePeriodEnd, computeRenewalPeriod } from "./expiry";

describe("computePeriodEnd", () => {
  it("treats end_date as the LAST day of cover", () => {
    // 30 days from 1 Sept covers 1-30 Sept, not 1 Sept - 1 Oct.
    expect(computePeriodEnd("2026-09-01", 30)).toBe("2026-09-30");
  });

  it("covers exactly `durationDays` inclusive days", () => {
    const start = "2026-09-15";
    const end = computePeriodEnd(start, 30);
    expect(end).toBe("2026-10-14");
    // Sept 15-30 is 16 days, Oct 1-14 is 14 days: 30 total.
    expect(Number(end.slice(8, 10))).toBe(14);
  });

  it("handles a single-day plan without collapsing to the day before", () => {
    expect(computePeriodEnd("2026-09-21", 1)).toBe("2026-09-21");
  });

  it("handles an annual plan across a leap year", () => {
    expect(computePeriodEnd("2028-01-01", 365)).toBe("2028-12-30");
  });

  it("refuses a nonsensical duration rather than guessing", () => {
    expect(() => computePeriodEnd("2026-09-01", 0)).toThrow(RangeError);
    expect(() => computePeriodEnd("2026-09-01", -5)).toThrow(RangeError);
  });
});

describe("computeRenewalPeriod", () => {
  it("starts the day after cover ends when renewing EARLY", () => {
    // The point of this test: renewing before expiry must not sacrifice the
    // days already paid for.
    const period = computeRenewalPeriod({
      currentEnd: "2026-09-30",
      today: "2026-09-25",
      durationDays: 30,
    });
    expect(period.startDate).toBe("2026-10-01");
    expect(period.endDate).toBe("2026-10-30");
  });

  it("starts today when renewing ON the last day of cover", () => {
    const period = computeRenewalPeriod({
      currentEnd: "2026-09-30",
      today: "2026-09-30",
      durationDays: 30,
    });
    // No gap and no overlap: tomorrow onward.
    expect(period.startDate).toBe("2026-10-01");
    expect(period.endDate).toBe("2026-10-30");
  });

  it("starts today when cover has already lapsed, and does NOT backdate", () => {
    // A member who lapsed in March must not be charged for March-September.
    const period = computeRenewalPeriod({
      currentEnd: "2026-03-31",
      today: "2026-09-25",
      durationDays: 30,
    });
    expect(period.startDate).toBe("2026-09-25");
    expect(period.endDate).toBe("2026-10-24");
  });

  it("treats a member who never had cover as starting today", () => {
    const period = computeRenewalPeriod({
      currentEnd: null,
      today: "2026-09-25",
      durationDays: 30,
    });
    expect(period.startDate).toBe("2026-09-25");
  });

  it("gives a full period with no lost days across repeated renewals", () => {
    let end: string | null = null;
    let today = "2026-01-01";
    for (let i = 0; i < 12; i++) {
      const period = computeRenewalPeriod({ currentEnd: end, today, durationDays: 30 });
      const covered =
        Math.round(
          (Date.parse(`${period.endDate}T00:00:00Z`) -
            Date.parse(`${period.startDate}T00:00:00Z`)) /
            86_400_000
        ) + 1;
      expect(covered).toBe(30);
      end = period.endDate;
      today = period.startDate;
    }
  });
});

describe("applyFreeze", () => {
  it("pushes the end date out by the frozen days", () => {
    expect(applyFreeze({ endDate: "2026-09-30", additionalFreezeDays: 7 })).toBe("2026-10-07");
  });

  it("leaves the date alone for a no-op freeze", () => {
    expect(applyFreeze({ endDate: "2026-09-30", additionalFreezeDays: 0 })).toBe("2026-09-30");
    expect(applyFreeze({ endDate: "2026-09-30", additionalFreezeDays: -3 })).toBe("2026-09-30");
  });

  it("accumulates across repeated short freezes", () => {
    let end = "2026-09-30";
    for (let i = 0; i < 3; i++) end = applyFreeze({ endDate: end, additionalFreezeDays: 5 });
    expect(end).toBe("2026-10-15");
  });
});
