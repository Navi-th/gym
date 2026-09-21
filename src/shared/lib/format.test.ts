import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatRelativeDays,
  initials,
} from "./format";

describe("money", () => {
  it("renders minor units as major units, two decimals", () => {
    expect(formatMoney(6900)).toBe("₹69.00");
    expect(formatMoney(118800)).toBe("₹1188.00");
    expect(formatMoney(0)).toBe("₹0.00");
    expect(formatMoney(5)).toBe("₹0.05");
  });

  it("compact form drops .00 but keeps real paise", () => {
    expect(formatMoneyCompact(6900)).toBe("₹69");
    expect(formatMoneyCompact(6950)).toBe("₹69.50");
  });

  it("accepts an override currency", () => {
    expect(formatMoney(6900, "$")).toBe("$69.00");
  });

  it("never produces floating point artefacts", () => {
    // Integer minor units exist precisely so this cannot happen.
    expect(formatMoney(1010)).toBe("₹10.10");
    expect(formatMoney(9999)).toBe("₹99.99");
  });
});

describe("formatDate", () => {
  it("renders a plain date", () => {
    expect(formatDate("2026-09-26")).toBe("26 Sep 2026");
  });

  it("accepts a full timestamp and uses its UTC date", () => {
    // Must not shift by a day depending on the server's timezone.
    expect(formatDate("2026-09-26T23:30:00.000Z")).toBe("26 Sep 2026");
    expect(formatDate("2026-09-26T00:30:00.000Z")).toBe("26 Sep 2026");
  });

  it("renders a placeholder for missing or unparseable values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatRelativeDays", () => {
  it("names the near days in words", () => {
    expect(formatRelativeDays(0)).toBe("today");
    expect(formatRelativeDays(1)).toBe("tomorrow");
    expect(formatRelativeDays(-1)).toBe("yesterday");
  });

  it("counts forward and backward beyond that", () => {
    expect(formatRelativeDays(5)).toBe("in 5 days");
    expect(formatRelativeDays(2)).toBe("in 2 days");
    expect(formatRelativeDays(-3)).toBe("3 days ago");
    expect(formatRelativeDays(-30)).toBe("30 days ago");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Test Member One")).toBe("TM");
  });

  it("copes with a single word", () => {
    expect(initials("Aarav")).toBe("A");
  });

  it("copes with extra and repeated spaces", () => {
    expect(initials("  Test   Member  ")).toBe("TM");
  });

  it("returns an empty string rather than throwing on no input", () => {
    expect(initials("")).toBe("");
  });
});
