import { describe, expect, it } from "vitest";
import { errorChainMessage, isUniqueConstraintError } from "./errors";

/** Builds the shape Drizzle actually produces: outer wrapper, real cause inside. */
function drizzleStyleError(causeMessage: string): Error {
  const inner = new Error(causeMessage);
  const outer = new Error('Failed query: insert into "messages" ...');
  (outer as { cause?: unknown }).cause = inner;
  return outer;
}

describe("errorChainMessage", () => {
  it("walks the cause chain", () => {
    const message = errorChainMessage(drizzleStyleError("D1_ERROR: UNIQUE constraint failed"));
    expect(message).toContain("Failed query");
    expect(message).toContain("UNIQUE constraint failed");
  });

  it("handles a plain error with no cause", () => {
    expect(errorChainMessage(new Error("boom"))).toBe("boom");
  });

  it("handles non-error values without throwing", () => {
    expect(errorChainMessage("just a string")).toBe("just a string");
    expect(errorChainMessage(null)).toBe("");
    expect(errorChainMessage(undefined)).toBe("");
    expect(errorChainMessage({ message: "plain object" })).toContain("plain object");
  });

  it("does not hang on a self-referential chain", () => {
    const looping = new Error("loop") as Error & { cause?: unknown };
    looping.cause = looping;
    expect(errorChainMessage(looping)).toContain("loop");
  });
});

describe("isUniqueConstraintError", () => {
  it("detects a wrapped UNIQUE violation — the bug this exists for", () => {
    // Checking error.message alone misses this entirely, which is how the
    // duplicate-message guard returned 500 instead of 409.
    const wrapped = drizzleStyleError(
      "D1_ERROR: UNIQUE constraint failed: messages.dedupe_key: SQLITE_CONSTRAINT"
    );
    expect(isUniqueConstraintError(wrapped)).toBe(true);
    expect(String(wrapped.message)).not.toContain("UNIQUE");
  });

  it("is case-insensitive", () => {
    expect(isUniqueConstraintError(new Error("unique constraint failed"))).toBe(true);
  });

  it("is false for unrelated failures", () => {
    expect(isUniqueConstraintError(new Error("network timeout"))).toBe(false);
    expect(isUniqueConstraintError(drizzleStyleError("NOT NULL constraint failed"))).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
  });
});
