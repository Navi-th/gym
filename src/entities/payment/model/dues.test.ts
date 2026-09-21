import { describe, expect, it } from "vitest";
import { daysOverdue, isOverdue, selectDues } from "./dues";

const TODAY = "2026-09-21";

describe("isOverdue", () => {
  it("is true once cover has run out", () => {
    expect(isOverdue({ planEnd: "2026-09-20" }, TODAY)).toBe(true);
    expect(isOverdue({ planEnd: "2026-01-01" }, TODAY)).toBe(true);
  });

  it("is false while cover is still running", () => {
    expect(isOverdue({ planEnd: TODAY }, TODAY)).toBe(false);
    expect(isOverdue({ planEnd: "2026-09-22" }, TODAY)).toBe(false);
  });

  it("is false for someone who never had cover", () => {
    // A lead is not in arrears; they have not bought anything yet.
    expect(isOverdue({ planEnd: null }, TODAY)).toBe(false);
  });

  it("only flips on the day AFTER cover ends", () => {
    expect(isOverdue({ planEnd: "2026-09-21" }, TODAY)).toBe(false);
    expect(isOverdue({ planEnd: "2026-09-20" }, TODAY)).toBe(true);
  });
});

describe("daysOverdue", () => {
  it("counts whole days since cover ended", () => {
    expect(daysOverdue("2026-09-20", TODAY)).toBe(1);
    expect(daysOverdue("2026-09-01", TODAY)).toBe(20);
  });

  it("goes negative while cover is still running", () => {
    expect(daysOverdue("2026-09-26", TODAY)).toBe(-5);
    expect(daysOverdue(TODAY, TODAY)).toBe(0);
  });
});

describe("selectDues", () => {
  const people = [
    { id: "lead", planEnd: null },
    { id: "current", planEnd: "2026-10-20" },
    { id: "lastday", planEnd: "2026-09-21" },
    { id: "yesterday", planEnd: "2026-09-20" },
    { id: "longgone", planEnd: "2026-06-01" },
  ];

  it("keeps only people whose cover has ended", () => {
    expect(selectDues(people, TODAY).map((p) => p.id)).toEqual(["longgone", "yesterday"]);
  });

  it("orders longest-lapsed first, so the conversations differ", () => {
    const result = selectDues(people, TODAY).map((p) => p.id);
    expect(result[0]).toBe("longgone");
  });

  it("excludes a lead, who has bought nothing yet", () => {
    expect(selectDues(people, TODAY).some((p) => p.id === "lead")).toBe(false);
  });

  it("excludes someone expiring today, who is not yet in arrears", () => {
    expect(selectDues(people, TODAY).some((p) => p.id === "lastday")).toBe(false);
  });

  it("does not mutate its input", () => {
    const copy = [...people];
    selectDues(people, TODAY);
    expect(people).toEqual(copy);
  });

  it("returns empty for an empty list", () => {
    expect(selectDues([], TODAY)).toEqual([]);
  });
});
