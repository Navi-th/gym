import { describe, expect, it } from "vitest";
import { isWiredTrigger, selectDueForRule, WIRED_TRIGGERS } from "./select";

const TODAY = "2026-10-08";

type Person = {
  id: string;
  planEnd: string | null;
  stage: string;
  deletedAt?: string | null;
};

const person = (over: Partial<Person> & { id: string }): Person => ({
  planEnd: null,
  stage: "active",
  deletedAt: null,
  ...over,
});

describe("selectDueForRule", () => {
  it("matches the whole expiring window, not one exact day", () => {
    const people = [
      person({ id: "in-7", planEnd: "2026-10-15" }),
      person({ id: "in-1", planEnd: "2026-10-09" }),
      person({ id: "today", planEnd: TODAY }),
      person({ id: "too-far", planEnd: "2026-10-16" }),
    ];

    expect(selectDueForRule({ trigger: "plan_expiring", offsetDays: 7, people, today: TODAY }).map((p) => p.id)).toEqual([
      "in-7",
      "in-1",
      "today",
    ]);
  });

  it("narrows with the offset, so a 1-day rule only sees tomorrow", () => {
    const people = [
      person({ id: "in-7", planEnd: "2026-10-15" }),
      person({ id: "in-1", planEnd: "2026-10-09" }),
    ];

    expect(selectDueForRule({ trigger: "plan_expiring", offsetDays: 1, people, today: TODAY }).map((p) => p.id)).toEqual([
      "in-1",
    ]);
  });

  it("excludes frozen members even when their date is in range", () => {
    const people = [person({ id: "frozen", planEnd: "2026-10-09", stage: "frozen" })];
    expect(selectDueForRule({ trigger: "plan_expiring", offsetDays: 7, people, today: TODAY })).toEqual([]);
  });

  it("excludes soft-deleted members", () => {
    const people = [person({ id: "gone", planEnd: "2026-10-09", deletedAt: "2026-10-01" })];
    expect(selectDueForRule({ trigger: "plan_expiring", offsetDays: 7, people, today: TODAY })).toEqual([]);
  });

  it("excludes members with no end date", () => {
    const people = [person({ id: "no-plan" })];
    expect(selectDueForRule({ trigger: "plan_expiring", offsetDays: 7, people, today: TODAY })).toEqual([]);
  });

  it("selects lapsed members for payment_due and nobody else", () => {
    const people = [
      person({ id: "lapsed", planEnd: "2026-10-01" }),
      person({ id: "expires-today", planEnd: TODAY }),
      person({ id: "future", planEnd: "2026-11-01" }),
    ];

    expect(selectDueForRule({ trigger: "payment_due", offsetDays: 0, people, today: TODAY }).map((p) => p.id)).toEqual([
      "lapsed",
    ]);
  });

  // An unwired trigger must return nothing rather than a plausible-looking list
  // computed from the wrong field.
  it("returns nothing for triggers that are not wired", () => {
    const people = [person({ id: "anyone", planEnd: "2026-10-09" })];
    expect(selectDueForRule({ trigger: "welcome", offsetDays: 0, people, today: TODAY })).toEqual([]);
    expect(selectDueForRule({ trigger: "payment_overdue", offsetDays: 0, people, today: TODAY })).toEqual([]);
  });
});

describe("isWiredTrigger", () => {
  it("accepts exactly the wired triggers", () => {
    for (const trigger of WIRED_TRIGGERS) expect(isWiredTrigger(trigger)).toBe(true);
    expect(isWiredTrigger("welcome")).toBe(false);
    expect(isWiredTrigger("nonsense")).toBe(false);
  });
});
