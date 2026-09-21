import { describe, expect, it } from "vitest";
import { centsToPriceInput, parsePriceToCents } from "./price";

describe("parsePriceToCents", () => {
  it("parses whole and fractional amounts", () => {
    expect(parsePriceToCents("69")).toBe(6900);
    expect(parsePriceToCents("69.5")).toBe(6950);
    expect(parsePriceToCents("69.99")).toBe(6999);
    expect(parsePriceToCents("0.05")).toBe(5);
  });

  it("ignores currency symbols, separators and whitespace", () => {
    expect(parsePriceToCents("₹69.99")).toBe(6999);
    expect(parsePriceToCents(" $1,188.00 ")).toBe(118800);
    expect(parsePriceToCents("1 188")).toBe(118800);
  });

  it("is exact where floating point is not", () => {
    // The reason this parses strings: 1.005 * 100 is 100.49999999999999 in
    // binary floating point, so Math.round would give 100 instead of 101.
    expect(parsePriceToCents("1.005")).toBeNull(); // 3dp rejected outright
    expect(parsePriceToCents("1.01")).toBe(101);
    expect(parsePriceToCents("8.29")).toBe(829);
    expect(parsePriceToCents("1188.10")).toBe(118810);
  });

  it("pads a single decimal digit rather than reading it as cents", () => {
    expect(parsePriceToCents("7.5")).toBe(750);
  });

  it("rejects junk rather than guessing", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("69.999")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
    expect(parsePriceToCents("6.9.9")).toBeNull();
  });
});

describe("centsToPriceInput", () => {
  it("round-trips with parsePriceToCents", () => {
    for (const cents of [0, 5, 6900, 6950, 6999, 118800]) {
      expect(parsePriceToCents(centsToPriceInput(cents))).toBe(cents);
    }
  });

  it("pads the minor units so the input does not shift by a factor of ten", () => {
    expect(centsToPriceInput(6905)).toBe("69.05");
  });
});
