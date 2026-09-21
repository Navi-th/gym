import { describe, expect, it } from "vitest";
import { formatPhone, normalisePhone } from "./phone";

describe("normalisePhone", () => {
  it("strips the punctuation humans type", () => {
    expect(normalisePhone("98765 43210")).toBe("+919876543210");
    expect(normalisePhone("98765-43210")).toBe("+919876543210");
    expect(normalisePhone("987.654.3210")).toBe("+919876543210");
    expect(normalisePhone("(98765) 43210")).toBe("+919876543210");
    expect(normalisePhone("  98765 43210  ")).toBe("+919876543210");
  });

  it("assumes the default country code for a bare national number", () => {
    expect(normalisePhone("9876543210")).toBe("+919876543210");
  });

  it("strips the national trunk prefix before applying the country code", () => {
    expect(normalisePhone("09876543210")).toBe("+919876543210");
    expect(normalisePhone("098765 43210")).toBe("+919876543210");
  });

  it("treats 00 as an international access prefix", () => {
    expect(normalisePhone("0091 98765 43210")).toBe("+919876543210");
  });

  it("never overrides an explicit country code", () => {
    expect(normalisePhone("+1 415 555 1234")).toBe("+14155551234");
    expect(normalisePhone("+44 7911 123456")).toBe("+447911123456");
    expect(normalisePhone("+919876543210")).toBe("+919876543210");
  });

  it("is idempotent — normalising twice changes nothing", () => {
    const once = normalisePhone("98765 43210");
    expect(normalisePhone(once as string)).toBe(once);
  });

  it("rejects empty and clearly-too-short input", () => {
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone("   ")).toBeNull();
    expect(normalisePhone("+")).toBeNull();
    expect(normalisePhone("12")).toBeNull();
    expect(normalisePhone("12345")).toBeNull();
  });

  it("rejects input with no digits at all", () => {
    expect(normalisePhone("not a number")).toBeNull();
    expect(normalisePhone("---")).toBeNull();
  });

  it("judges length on the COMBINED number, per E.164's 8-15 digits", () => {
    // Boundary documented rather than hidden: +91 plus 6 digits is 8 total, so
    // it passes. Format-valid is not the same as dialable — this is a
    // deliberately loose check, because tightening it would start rejecting
    // legitimate international numbers.
    expect(normalisePhone("12345")).toBeNull(); // 91 12345     = 7 digits
    expect(normalisePhone("123456")).toBe("+91123456"); // 91 123456    = 8 digits
    expect(normalisePhone("+123456789012345")).toBe("+123456789012345"); // 15
    expect(normalisePhone("+1234567890123456")).toBeNull(); // 16
  });

  it("honours a custom default country code", () => {
    expect(normalisePhone("4155551234", "+1")).toBe("+14155551234");
  });

  it("documents the single-country assumption", () => {
    // A bare 10-digit number is assumed LOCAL. "4155551234" is a US number but
    // is read as +91 4155551234. Correct for a one-country gym; require the +
    // prefix if that ever stops being true.
    expect(normalisePhone("4155551234")).toBe("+914155551234");
    expect(normalisePhone("4155551234", "+1")).toBe("+14155551234");
  });
});

describe("formatPhone", () => {
  it("groups Indian numbers for display", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });

  it("leaves other country codes alone rather than guessing a format", () => {
    expect(formatPhone("+14155551234")).toBe("+14155551234");
  });

  it("renders a placeholder for missing numbers", () => {
    expect(formatPhone(null)).toBe("—");
    expect(formatPhone(undefined)).toBe("—");
  });
});
