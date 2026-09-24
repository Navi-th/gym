import { describe, it, expect } from "vitest";

describe("getDues helper specs", () => {
  it("exports getDues and getDuesCount functions", async () => {
    const { getDues, getDuesCount } = await import("./get-dues");
    expect(typeof getDues).toBe("function");
    expect(typeof getDuesCount).toBe("function");
  });
});
