import { describe, expect, it } from "vitest";
import { validateMemberInput } from "./validate";

const MINIMAL = { fullName: "Aarav Sharma", phone: "98765 43210" };

/** Narrowing helper so tests read cleanly. */
function errorsOf(input: Parameters<typeof validateMemberInput>[0]) {
  const result = validateMemberInput(input);
  if (result.ok) throw new Error("expected validation to fail, but it passed");
  return result.errors;
}

function valueOf(input: Parameters<typeof validateMemberInput>[0]) {
  const result = validateMemberInput(input);
  if (!result.ok) throw new Error(`expected validation to pass: ${JSON.stringify(result.errors)}`);
  return result.value;
}

describe("validateMemberInput - acceptance", () => {
  it("accepts the minimum viable member", () => {
    const value = valueOf(MINIMAL);
    expect(value.fullName).toBe("Aarav Sharma");
    expect(value.phone).toBe("+919876543210");
    expect(value.stage).toBe("active");
  });

  it("normalises the phone on the way through", () => {
    expect(valueOf({ fullName: "Test", phone: "098765-43210" }).phone).toBe("+919876543210");
  });

  it("trims surrounding whitespace", () => {
    const value = valueOf({ fullName: "  Aarav Sharma  ", phone: " 98765 43210 " });
    expect(value.fullName).toBe("Aarav Sharma");
  });

  it("defaults whatsappOptIn to false, because consent is opt-in", () => {
    expect(valueOf(MINIMAL).whatsappOptIn).toBe(false);
    expect(valueOf({ ...MINIMAL, whatsappOptIn: true }).whatsappOptIn).toBe(true);
  });

  it("treats empty optional strings as absent, not as invalid values", () => {
    const value = valueOf({ ...MINIMAL, email: "" });
    expect(value.email).toBeNull();
  });

  it("accepts each valid stage", () => {
    for (const stage of ["active", "frozen"] as const) {
      expect(valueOf({ ...MINIMAL, stage }).stage).toBe(stage);
    }
  });
});

describe("validateMemberInput - rejection", () => {
  it("requires a name", () => {
    expect(errorsOf({ ...MINIMAL, fullName: "" })).toHaveProperty("fullName");
    expect(errorsOf({}).fullName).toBeDefined();
  });

  it("rejects a one-character name", () => {
    expect(errorsOf({ ...MINIMAL, fullName: "A" }).fullName).toMatch(/at least 2/);
  });

  it("rejects an over-long name", () => {
    expect(errorsOf({ ...MINIMAL, fullName: "x".repeat(121) }).fullName).toMatch(/under 120/);
  });

  it("requires a phone", () => {
    expect(errorsOf({ fullName: "Test", phone: "" }).phone).toMatch(/required/i);
  });

  it("rejects an unusable phone", () => {
    expect(errorsOf({ ...MINIMAL, phone: "12" }).phone).toMatch(/valid phone/i);
  });

  it("rejects a malformed email but allows it to be omitted", () => {
    expect(errorsOf({ ...MINIMAL, email: "nope" }).email).toMatch(/valid email/i);
    expect(errorsOf({ ...MINIMAL, email: "no@domain" }).email).toMatch(/valid email/i);
    expect(valueOf({ ...MINIMAL, email: null }).email).toBeNull();
  });

  it("rejects an unknown stage", () => {
    // Guards against a hand-crafted request body bypassing the UI.
    expect(errorsOf({ ...MINIMAL, stage: "wizard" as never }).stage).toMatch(/must be one of/i);
  });

  it("reports EVERY problem at once, not just the first", () => {
    // So a user fixing the form is not forced through one error per submit.
    const errors = errorsOf({ fullName: "A", phone: "1", email: "bad" });
    expect(Object.keys(errors).sort()).toEqual(["email", "fullName", "phone"]);
  });
});
