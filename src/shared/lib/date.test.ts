import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isIsoDate, toDateOnly, todayUtc } from "./date";

describe("toDateOnly", () => {
  it("normalises dates and timestamps alike", () => {
    expect(toDateOnly("2026-09-21")).toBe("2026-09-21");
    expect(toDateOnly("2026-09-21T08:31:00.000Z")).toBe("2026-09-21");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-28", 5)).toBe("2026-10-03");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("subtracts with a negative count", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("is unaffected by a month boundary mid-year", () => {
    expect(addDays("2026-04-30", 1)).toBe("2026-05-01");
  });
});

describe("daysBetween", () => {
  it("counts whole days forward, backward and zero", () => {
    expect(daysBetween("2026-09-21", "2026-09-26")).toBe(5);
    expect(daysBetween("2026-09-21", "2026-09-21")).toBe(0);
    expect(daysBetween("2026-09-21", "2026-09-18")).toBe(-3);
  });

  it("is the exact inverse of addDays", () => {
    for (const n of [1, 7, 30, 365]) {
      expect(daysBetween("2026-01-15", addDays("2026-01-15", n))).toBe(n);
    }
  });
});

describe("todayUtc", () => {
  it("takes the UTC date, not the local one", () => {
    expect(todayUtc(new Date("2026-09-21T23:30:00Z"))).toBe("2026-09-21");
    expect(todayUtc(new Date("2026-09-21T00:30:00Z"))).toBe("2026-09-21");
  });
});

describe("isIsoDate", () => {
  it("accepts dates and timestamps", () => {
    expect(isIsoDate("2026-09-21")).toBe(true);
    expect(isIsoDate("2026-09-21T08:31:00Z")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isIsoDate("21/09/2026")).toBe(false);
    expect(isIsoDate("not-a-date")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
    expect(isIsoDate(20260921)).toBe(false);
  });
});
