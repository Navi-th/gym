/**
 * Shared harness for the end-to-end suites.
 *
 * These suites drive the REAL HTTP API against `next dev` and the local D1, so
 * they exercise the whole chain — route handler, entity, SQL, constraints —
 * rather than a mocked seam. That is deliberate: the two bugs that reading and
 * unit tests both missed were found here (a status rule that contradicted the
 * stored value, and a UNIQUE violation reported as a 500 because Drizzle buries
 * the constraint text in `.cause`).
 *
 * They are NOT idempotent — each expects a freshly seeded database, which is
 * why `npm run test:e2e` resets and seeds first. Run them individually only
 * against a known state.
 */

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

let pass = 0;
let fail = 0;
const failing = [];

/** Compares as strings so "1" and 1 both work, and records the outcome. */
export function check(name, got, want) {
  const ok = String(got) === String(want);
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${name}` +
      (ok ? ` -> ${got}` : ` -> got ${got}, want ${want}`)
  );
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    failing.push(name);
  }
}

/** JSON request helper. Body is serialised only when one is supplied. */
export async function req(method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Some responses have no body; the status is still meaningful.
  }
  return { status: response.status, json };
}

/** Adds days to a YYYY-MM-DD string in UTC, matching the app's own maths. */
export function addDays(dateOnly, days) {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/** Prints the suite summary and returns whether it passed. */
export function report(label) {
  console.log(`\n${label}: ${pass} passed, ${fail} failed`);
  if (failing.length > 0) {
    console.log(`  failing checks: ${failing.join("; ")}`);
  }
  return fail === 0;
}
