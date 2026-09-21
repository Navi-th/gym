#!/usr/bin/env node
/**
 * End-to-end suite runner.
 *
 *   npm run test:e2e
 *
 * EACH suite gets its own freshly seeded database AND its own dev server, so
 * the suites are independent, individually re-runnable, and safe to reorder.
 *
 * That isolation was not the first design. Two simpler ones both failed:
 *
 *   1. One reset, one server, all suites sharing it. `payments` fixes the one
 *      lapsed member, so `reminders` afterwards counted zero lapsed instead of
 *      one. Shared state masquerading as a bug in the app.
 *
 *   2. One server, a reset before each suite. Worse: deleting
 *      `.wrangler/state/v3/d1` underneath a running `next dev` leaves its D1
 *      handle pointing at a file that no longer exists, and every request
 *      afterwards returns 500.
 *
 * So: reset with nothing running, start a server, run one suite, stop it.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SUITES = ["members", "subs", "plans", "payments", "reminders"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isServerUp() {
  try {
    const response = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(condition, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return true;
    await sleep(400);
  }
  return false;
}

/** Resets and seeds the local D1. Returns an error string, or null on success. */
function resetDatabase() {
  const result = spawnSync("npm", ["run", "db:reset:local"], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "pipe"],
    encoding: "utf8",
  });
  return result.status === 0 ? null : (result.stderr ?? "unknown failure");
}

/**
 * Starts a dev server, detached so its whole process group (next spawns
 * children) can be killed cleanly rather than orphaned on port 3000.
 */
async function startServer() {
  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  let log = "";
  child.stdout.on("data", (chunk) => { log += chunk; });
  child.stderr.on("data", (chunk) => { log += chunk; });

  const ready = await waitFor(isServerUp, 45_000);
  return { child, log, ready };
}

/**
 * Stops a server and CONFIRMS it is gone.
 *
 * SIGTERM first, then SIGKILL if it will not go. An earlier version trusted a
 * single SIGTERM and a leftover server raced the next suite for port 3000,
 * which wedged the run rather than failing it.
 */
async function stopServer(child) {
  if (!child || child.pid === undefined) return;

  const signalGroup = (signal) => {
    try { process.kill(-child.pid, signal); } catch { /* already gone */ }
  };

  signalGroup("SIGTERM");
  if (await waitFor(async () => !(await isServerUp()), 8_000)) return;

  console.log("e2e: server ignored SIGTERM, sending SIGKILL");
  signalGroup("SIGKILL");
  await waitFor(async () => !(await isServerUp()), 5_000);
}

/** Stops the server, then the runtime it leaked. */
async function shutDown(child) {
  await stopServer(child);
  reapWorkerd();
}

/**
 * Reaps the local Cloudflare runtime.
 *
 * initOpenNextCloudflareForDev() starts a `workerd` proxy to serve local D1,
 * and that proxy does NOT die with its parent dev server. Killing the server
 * alone left one orphan per suite - four by the end of a run, each still
 * holding the database file. That is a slow leak across runs, and stale proxies
 * against a reset database are exactly the kind of thing that produces
 * confusing failures later.
 *
 * Matched on THIS project's node_modules path, so a workerd belonging to some
 * other wrangler project on the machine is left alone.
 */
function reapWorkerd() {
  try {
    spawnSync("pkill", ["-f", join(ROOT, "node_modules/@cloudflare/workerd")], {
      stdio: "ignore",
    });
  } catch {
    // pkill is unavailable (non-POSIX platform); nothing to reap.
  }
}

function runSuite(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(HERE, script)], {
      cwd: ROOT,
      stdio: "inherit",
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

// ---------------------------------------------------------------------------
// Pre-flight
// ---------------------------------------------------------------------------

// Something already on the port would race every suite's server and produce a
// wedged, confusing run. Better to refuse than to half-work.
if (await isServerUp()) {
  console.error(
    `e2e: something is already listening on ${BASE}.\n` +
      "     Stop it first (the runner needs the port to itself)."
  );
  process.exit(1);
}

// A production build left in .next confuses `next dev`: it once made `/` return
// 404 while every /admin route still answered 200, which reads as a routing bug
// and is not one. BUILD_ID is written by `next build` and never by `next dev`,
// so its presence is a precise signal.
//
// Cleared conditionally, not unconditionally: clearing always would force every
// suite to compile cold and roughly triple the run time.
if (existsSync(join(ROOT, ".next", "BUILD_ID"))) {
  rmSync(join(ROOT, ".next"), { recursive: true, force: true });
  console.log("e2e: cleared a stale production .next");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const results = [];

for (const suite of SUITES) {
  console.log(`\n########## ${suite.toUpperCase()} ##########`);

  // Reset FIRST, with nothing running: replacing the SQLite file under a live
  // dev server breaks its handle.
  const resetError = resetDatabase();
  if (resetError) {
    console.error(`e2e: database reset failed before ${suite}:\n${resetError}`);
    results.push({ suite, ok: false });
    continue;
  }

  const server = await startServer();
  if (!server.ready) {
    console.error(`e2e: the dev server never became ready for ${suite}.\n${server.log}`);
    await shutDown(server.child);
    results.push({ suite, ok: false });
    continue;
  }

  const code = await runSuite(`${suite}.mjs`);
  await shutDown(server.child);
  results.push({ suite, ok: code === 0 });
}

const failed = results.filter((result) => !result.ok);
console.log("\n########## SUMMARY ##########");
for (const result of results) {
  console.log(`  ${result.ok ? "PASS" : "FAIL"}  ${result.suite}`);
}
console.log(`\n${results.length - failed.length}/${results.length} suites passed`);

reapWorkerd();
process.exit(failed.length === 0 ? 0 : 1);
