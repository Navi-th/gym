/**
 * Error inspection helpers.
 *
 * WHY THIS EXISTS: Drizzle wraps driver errors. A UNIQUE violation arrives as
 * a `DrizzleQueryError` whose own message is just "Failed query: insert into
 * ..." — the actual constraint text lives in `.cause`. Matching on the
 * top-level message therefore fails silently, and a clean 409 turns into an
 * opaque 500.
 *
 * That is not hypothetical: the message ledger's duplicate guard was broken
 * this exact way until an end-to-end test caught it.
 */

/** Flattens an error and its whole `cause` chain into one searchable string. */
export function errorChainMessage(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;

  // Bounded so a self-referential cause chain cannot hang the request.
  for (let depth = 0; depth < 10 && current != null; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    if (typeof current === "object") {
      const message = (current as { message?: unknown }).message;
      if (typeof message === "string") parts.push(message);
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    parts.push(String(current));
    break;
  }

  return parts.join(" | ");
}

/**
 * True when a write failed on a UNIQUE constraint, however deeply Drizzle has
 * wrapped it.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return /UNIQUE constraint failed/i.test(errorChainMessage(error));
}
