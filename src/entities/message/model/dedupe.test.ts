import { describe, expect, it } from "vitest";
import { buildDedupeKey } from "./dedupe";

describe("buildDedupeKey", () => {
  it("combines parts", () => {
    expect(
      buildDedupeKey({
        memberId: "mem_1",
        ruleId: "rule_1",
        templateKey: "expiry_7d",
      })
    ).toBe("mem_1:rule_1:expiry_7d");
  });

  it("is deterministic", () => {
    const input = { memberId: "m", ruleId: "r", templateKey: "t" };
    expect(buildDedupeKey(input)).toBe(buildDedupeKey({ ...input }));
  });

  it("normalises null and undefined to a sentinel", () => {
    const fromNull = buildDedupeKey({
      memberId: "m",
      ruleId: null,
      templateKey: "t",
    });
    const fromUndefined = buildDedupeKey({ memberId: "m", templateKey: "t" });
    expect(fromNull).toBe("m:-:t");
    expect(fromUndefined).toBe(fromNull);
  });
});
