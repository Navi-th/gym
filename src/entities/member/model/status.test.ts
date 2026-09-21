import { describe, expect, it } from "vitest";
import { addDays } from "@/shared/lib";
import {
  countMembersByStatus,
  daysUntilExpiry,
  deriveMemberStatus,
  EXPIRING_SOON_DAYS,
  selectRenewalsQueue,
} from "./status";

/** Fixed clock so these never depend on the day they run. */
const TODAY = new Date("2026-09-21T00:00:00Z");

const statusAt = (stage: "active" | "frozen", planEnd?: string | null) =>
  deriveMemberStatus({ stage, planEnd, today: TODAY });

describe("deriveMemberStatus", () => {
  it("passes manual stages through untouched, whatever the dates say", () => {
    expect(statusAt("frozen", "2027-01-01")).toBe("frozen");
  });

  it("reports active when expiry is comfortably ahead", () => {
    expect(statusAt("active", "2026-10-11")).toBe("active");
  });

  it("reports expiring_soon inside the warning window", () => {
    expect(statusAt("active", "2026-09-26")).toBe("expiring_soon");
  });

  it("treats the final eligible day as expiring_soon, not expired", () => {
    expect(statusAt("active", "2026-09-21")).toBe("expiring_soon");
  });

  it(`includes exactly EXPIRING_SOON_DAYS (${EXPIRING_SOON_DAYS}) and no more`, () => {
    const lastDayInWindow = addDays("2026-09-21", EXPIRING_SOON_DAYS);
    const firstDayOutside = addDays("2026-09-21", EXPIRING_SOON_DAYS + 1);
    expect(statusAt("active", lastDayInWindow)).toBe("expiring_soon");
    expect(statusAt("active", firstDayOutside)).toBe("active");
  });

  it("reports expired from the day after the end date", () => {
    expect(statusAt("active", "2026-09-20")).toBe("expired");
    expect(statusAt("active", "2026-08-01")).toBe("expired");
  });

  it("REGRESSION: honours an explicit active stage with no end date", () => {
    expect(statusAt("active", null)).toBe("active");
    expect(statusAt("active", undefined)).toBe("active");
    expect(statusAt("active", "")).toBe("active");
  });

  it("ignores an unparseable end date rather than guessing from it", () => {
    expect(statusAt("active", "not-a-date")).toBe("active");
  });

  it("accepts a full ISO timestamp, not just a plain date", () => {
    expect(statusAt("active", "2026-09-26T12:00:00.000Z")).toBe("expiring_soon");
  });

  it("is driven by expiry, not by the stored stage being stale", () => {
    // A member whose plan lapsed while stage still says active must read
    // expired — this is the whole reason status is derived.
    expect(statusAt("active", "2026-09-18")).toBe("expired");
  });
});

describe("daysUntilExpiry", () => {
  it("is measured against today and goes negative into the past", () => {
    expect(daysUntilExpiry("2026-09-26", TODAY)).toBe(5);
    expect(daysUntilExpiry("2026-09-18", TODAY)).toBe(-3);
  });
});

describe("countMembersByStatus", () => {
  it("returns every key, so callers never read undefined", () => {
    const counts = countMembersByStatus([]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
    expect(counts.frozen).toBe(0);
    expect(counts.expiring_soon).toBe(0);
  });

  it("tallies by status and the total reconciles", () => {
    const list = [
      { status: "active" as const },
      { status: "active" as const },
      { status: "expiring_soon" as const },
      { status: "expired" as const },
      { status: "frozen" as const },
    ];
    const counts = countMembersByStatus(list);
    expect(counts).toMatchObject({
      active: 2,
      expiring_soon: 1,
      expired: 1,
      frozen: 1,
    });
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(list.length);
  });
});

describe("selectRenewalsQueue", () => {
  it("keeps only expiring and lapsed members", () => {
    const list = [
      { id: "a", status: "active" as const, planEnd: "2027-01-01" },
      { id: "b", status: "expiring_soon" as const, planEnd: "2026-09-26" },
      { id: "c", status: "expired" as const, planEnd: "2026-09-18" },
      { id: "e", status: "frozen" as const, planEnd: "2026-10-01" },
    ];
    expect(selectRenewalsQueue(list).map((m) => m.id)).toEqual(["c", "b"]);
  });

  it("orders most urgent first", () => {
    const list = [
      { id: "later", status: "expiring_soon" as const, planEnd: "2026-09-27" },
      { id: "sooner", status: "expiring_soon" as const, planEnd: "2026-09-22" },
      { id: "lapsed", status: "expired" as const, planEnd: "2026-08-01" },
    ];
    expect(selectRenewalsQueue(list).map((m) => m.id)).toEqual([
      "lapsed",
      "sooner",
      "later",
    ]);
  });

  it("does not mutate the array it was given", () => {
    const list = [
      { id: "b", status: "expiring_soon" as const, planEnd: "2026-09-26" },
      { id: "a", status: "expired" as const, planEnd: "2026-08-01" },
    ];
    selectRenewalsQueue(list);
    expect(list.map((m) => m.id)).toEqual(["b", "a"]);
  });
});
