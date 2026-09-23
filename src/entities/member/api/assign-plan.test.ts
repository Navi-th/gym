import { describe, expect, it } from "vitest";
import { computeRenewalDates } from "../model/status";

describe("computeRenewalDates", () => {
  it("extends from planEnd when renewing early during expiring_soon", () => {
    const result = computeRenewalDates({
      currentEnd: "2026-10-30",
      status: "expiring_soon",
      durationDays: 30,
      today: "2026-10-25",
    });
    expect(result.startDate).toBe("2026-10-30");
    expect(result.endDate).toBe("2026-11-28");
  });

  it("starts from today when renewing an expired plan", () => {
    const result = computeRenewalDates({
      currentEnd: "2026-10-20",
      status: "expired",
      durationDays: 30,
      today: "2026-10-25",
    });
    expect(result.startDate).toBe("2026-10-25");
    expect(result.endDate).toBe("2026-11-23");
  });
});
