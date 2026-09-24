import { describe, expect, it } from "vitest";
import { buildDedupeKey } from "./dedupe";

const PERIOD = "2026-10-15";

describe("buildDedupeKey", () => {
  it("combines parts", () => {
    expect(
      buildDedupeKey({
        memberId: "mem_1",
        ruleId: "rule_1",
        templateKey: "expiry_7d",
        period: PERIOD,
      })
    ).toBe("mem_1:rule_1:expiry_7d:2026-10-15");
  });

  it("is deterministic", () => {
    const input = { memberId: "m", ruleId: "r", templateKey: "t", period: PERIOD };
    expect(buildDedupeKey(input)).toBe(buildDedupeKey({ ...input }));
  });

  it("normalises null and undefined to a sentinel", () => {
    const fromNull = buildDedupeKey({
      memberId: "m",
      ruleId: null,
      templateKey: "t",
      period: null,
    });
    const fromUndefined = buildDedupeKey({ memberId: "m", templateKey: "t", period: null });
    expect(fromNull).toBe("m:-:t:-");
    expect(fromUndefined).toBe(fromNull);
  });

  // The regression this key change exists for: a member who renews must be
  // eligible for the same reminder on their next term.
  it("differs between two terms for the same member, rule and template", () => {
    const base = { memberId: "aarav", ruleId: "rule_7d", templateKey: "expiry_7d" };
    expect(buildDedupeKey({ ...base, period: "2026-08-30" })).not.toBe(
      buildDedupeKey({ ...base, period: "2026-09-29" })
    );
  });

  it("is identical for a retry within one term", () => {
    const base = {
      memberId: "aarav",
      ruleId: "rule_7d",
      templateKey: "expiry_7d",
      period: PERIOD,
    };
    expect(buildDedupeKey(base)).toBe(buildDedupeKey({ ...base }));
  });
});
