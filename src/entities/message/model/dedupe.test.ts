import { describe, expect, it } from "vitest";
import { buildDedupeKey } from "./dedupe";

/**
 * These guard the constraint that stops a retried cron re-messaging every
 * member — the single most expensive failure this system can have.
 */
describe("buildDedupeKey", () => {
  it("combines all four parts", () => {
    expect(
      buildDedupeKey({
        memberId: "mem_1",
        subscriptionId: "sub_1",
        ruleId: "rule_1",
        templateKey: "expiry_7d",
      })
    ).toBe("mem_1:sub_1:rule_1:expiry_7d");
  });

  it("is deterministic — the same send always produces the same key", () => {
    const input = { memberId: "m", subscriptionId: "s", ruleId: "r", templateKey: "t" };
    expect(buildDedupeKey(input)).toBe(buildDedupeKey({ ...input }));
  });

  it("normalises null and undefined to a sentinel, not to nothing", () => {
    // Critical: SQLite treats NULLs as distinct in a unique index, so the
    // key must never contain an empty segment or the guard silently fails.
    const fromNull = buildDedupeKey({
      memberId: "m",
      subscriptionId: null,
      ruleId: null,
      templateKey: "t",
    });
    const fromUndefined = buildDedupeKey({ memberId: "m", templateKey: "t" });
    expect(fromNull).toBe("m:-:-:t");
    expect(fromUndefined).toBe(fromNull);
    expect(fromNull).not.toContain("::");
  });

  it("separates different templates for the same member", () => {
    const base = { memberId: "m", subscriptionId: "s", ruleId: "r" };
    expect(buildDedupeKey({ ...base, templateKey: "expiry_7d" })).not.toBe(
      buildDedupeKey({ ...base, templateKey: "expiry_1d" })
    );
  });

  it("separates the same template across different members", () => {
    const base = { subscriptionId: "s", ruleId: "r", templateKey: "expiry_7d" };
    expect(buildDedupeKey({ ...base, memberId: "m1" })).not.toBe(
      buildDedupeKey({ ...base, memberId: "m2" })
    );
  });
});
