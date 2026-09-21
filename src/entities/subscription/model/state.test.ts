import { describe, expect, it } from "vitest";
import { DUE_SOON_DAYS, deriveSubscriptionState } from "./state";

const TODAY = "2026-09-21";

const at = (status: Parameters<typeof deriveSubscriptionState>[0]["status"], endDate: string) =>
  deriveSubscriptionState({ status, endDate, today: TODAY });

describe("deriveSubscriptionState", () => {
  it("reports active when cover runs comfortably ahead", () => {
    expect(at("active", "2026-11-19")).toBe("active");
  });

  it("reports due inside the warning window", () => {
    expect(at("active", "2026-09-26")).toBe("due");
  });

  it("includes the final day of cover as due, not lapsed", () => {
    expect(at("active", "2026-09-21")).toBe("due");
  });

  it(`includes exactly DUE_SOON_DAYS (${DUE_SOON_DAYS}) and no more`, () => {
    expect(at("active", "2026-09-28")).toBe("due");
    expect(at("active", "2026-09-29")).toBe("active");
  });

  it("reports lapsed from the day after cover ends", () => {
    expect(at("active", "2026-09-20")).toBe("lapsed");
  });

  it("reports expired rows that still claim active as lapsed", () => {
    // The stored status is not evidence — the date is.
    expect(at("active", "2026-03-31")).toBe("lapsed");
  });

  it("lets deliberate human states win over dates", () => {
    expect(at("frozen", "2026-09-01")).toBe("frozen");
    expect(at("cancelled", "2027-01-01")).toBe("cancelled");
  });
});
