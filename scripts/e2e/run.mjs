#!/usr/bin/env node
/**
 * End-to-end suite runner.
 *
 *   npm run test:e2e
 *
 * EACH suite gets its own freshly seeded database AND its own dev server, so
 * the suites are fully independent, individually re-runnable, and safe to
 * reorder.
 *
 * That isolation is not gold-plating; two simpler designs both failed here:
 *
 *   1. One reset, one server, all suites sharing it. `payments` fixes the one
 *      lapsed member, so `reminders` afterwards counted zero lapsed instead of
 *      one — shared state masquerading as a bug.
 *
 *   2. One server, a reset before each suite. This is worse: deleting
 *      `.wrangler/state/v3/d1` underneath a running `next dev` leaves its D1
 *      handle pointing at a file that no longer exists, and every subsequent
 *      request returns 500.
 *
 * So the order is: reset with no server up, start a server, run one suite, stop
 * it. It costs a few extra seconds per suite and removes an entire class of
 * confusing failure.
 */
import { spawn, spawnSync } from "node:child_process";
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

async function waitForServer(timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return true;
    await sleep(400);
  }
  return false;
}

async function waitForServerDown(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isServerUp())) return true;
    await sleep(300);
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

  if (!(await waitForServer())) return { child, log, ready: false };
  return { child, log, ready: true };
}

async function stopServer(child) {
  if (!child || child.pid === undefined) return;
  try { process.kill(-child.pid, "SIGTERM"); } catch {}
  await waitForServerDown();
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
    await stopServer(server.child);
    results.push({ suite, ok: false });
    continue;
  }

  const code = await runSuite(`${suite}.mjs`);
  await stopServer(server.child);
  results.push({ suite, ok: code === 0 });
}

const failed = results.filter((result) => !result.ok);
console.log("\n########## SUMMARY ##########");
for (const result of results) {
  console.log(`  ${result.ok ? "PASS" : "FAIL"}  ${result.suite}`);
}
console.log(`\n${results.length - failed.length}/${results.length} suites passed`);

process.exit(failed.length === 0 ? 0 : 1);
