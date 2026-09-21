# End-to-end suites

```bash
npm run test:e2e        # 5 suites, 156 assertions, ~100s
```

The runner gives **each suite its own freshly seeded database and its own dev
server**, so the suites are independent, re-runnable, and safe to reorder.

## Why these exist

They drive the **real HTTP API** against `next dev` and the local D1, which
means they exercise the whole chain — route handler, entity, SQL, constraints —
rather than a mocked seam.

That is not thoroughness for its own sake. **Both bugs that unit tests and
careful reading missed, these found:**

1. **A status rule that contradicted stored data.** A member created with
   `stage=active` and no `plan_end` was stored as active but rendered as *Lead*
   on every screen. A happy-path unit test on `deriveMemberStatus` would not have
   caught it, because the wrong assumption was baked into the test as well as the
   code. Creating a real row through the real API did.

2. **A UNIQUE violation reported as a 500.** Drizzle wraps driver errors: the
   constraint text lives in `.cause`, while the top-level message is just
   `Failed query: insert into ...`. The duplicate-send guard was silently broken,
   so staff would have seen "Internal Server Error" instead of "already sent".

## Suites

| Suite | Assertions | Covers |
|---|---|---|
| `members.mjs` | 30 | create, search by name and code, status filter, update, archive, phone freed after archiving |
| `subs.mjs` | 33 | assign, the atomic member projection, renew-early losing no days, freeze, double-assign guard |
| `plans.mjs` | 30 | create, partial-patch merge, retire/restore, a retired plan refused for assignment |
| `payments.mjs` | 29 | record, record-and-renew stamping the ledger period, arrears, revenue totals |
| `reminders.mjs` | 34 | template render, `wa.me` link, dedupe 409, consent refused server-side, all six pages 200 |

## Why each suite restarts the server

Two simpler designs were tried and both failed, which is why this one is the
way it is:

**One reset, one server, all suites sharing it.** `payments` fixes the one
lapsed member, so `reminders` afterwards counted zero lapsed instead of one.
Shared state presenting itself as a bug in the app.

**One server, a reset before each suite.** Worse: deleting
`.wrangler/state/v3/d1` underneath a running `next dev` leaves its D1 handle
pointing at a file that no longer exists, and every request afterwards returns
500.

The working order is therefore: reset with nothing running, start a server, run
one suite, stop it. It costs a few seconds each and removes a whole class of
confusing failure.

Suites are still NOT idempotent against a database they did not seed — running
one by hand twice will fail on counts and on the duplicate guards. Use the
runner, or reset first.

## Writing a new suite

```js
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

console.log("1. SOMETHING");
check("it works", (await req("GET", "/admin/api/plans")).status, 200);

process.exit(report("plans") ? 0 : 1);
```

Add the filename (without `.mjs`) to `SUITES` in `run.mjs`.

`BASE` is exported as `B` because page-render checks call `fetch(B + ...)`
directly rather than through `req`.

## What they deliberately do NOT cover

- **Rendering fidelity.** They assert on text present in the HTML, not layout.
- **Scheduled sending** (module 8) — there is no cron Worker yet.
- **Deployed behaviour.** Everything runs against `next dev` plus the local D1.
  The Cloudflare Access gate does not exist locally, so nothing here tests it.
