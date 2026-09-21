/**
 * Subscriptions: assign, renew early, freeze, double-assign guard.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset
 * and dev server are handled for you.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

// Seeded plan: 30 days of cover for 6900 minor units.
const PLAN_PRO_MONTHLY = "plan_pro_monthly";
const PRO_DURATION = 30;
const today = new Date().toISOString().slice(0, 10);
const E1 = addDays(today, PRO_DURATION - 1); // first period ends
try {
  await req("POST", "/admin/api/subscriptions", { memberId: "x", planId: "y" });
} catch {}

console.log("1. PICK A LEAD");
const leads = await req("GET", "/admin/api/members?status=lead");
const lead = leads.json?.members?.[0];
check("a lead exists", Boolean(lead), true);
check("lead has no plan end", lead?.planEnd, null);
check("lead derives as lead", lead?.status, "lead");

console.log("\n2. ASSIGN PLAN");
const assigned = await req("POST", "/admin/api/subscriptions", {
  memberId: lead.id,
  planId: PLAN_PRO_MONTHLY,
});
check("POST status", assigned.status, 201);
check("endDate is start + (duration-1)", assigned.json?.subscription?.endDate, E1);
check("status active", assigned.json?.subscription?.status, "active");
check("price snapshotted", assigned.json?.subscription?.priceCentsCharged, 6900);
const subId = assigned.json?.subscription?.id;

console.log("\n3. MEMBER PROJECTION UPDATED ATOMICALLY");
const afterAssign = await req("GET", `/admin/api/members/${lead.id}`);
check("member planId set", afterAssign.json?.member?.planId, PLAN_PRO_MONTHLY);
check("member planEnd set", afterAssign.json?.member?.planEnd, E1);
check("stage promoted lead -> active", afterAssign.json?.member?.stage, "active");
check("derived status now active", afterAssign.json?.member?.status, "active");

console.log("\n4. NO DOUBLE SUBSCRIPTION");
const dupe = await req("POST", "/admin/api/subscriptions", {
  memberId: lead.id,
  planId: PLAN_PRO_MONTHLY,
});
check("second assign -> 409", dupe.status, 409);

console.log("\n5. VALIDATION");
check("missing ids -> 422", (await req("POST", "/admin/api/subscriptions", {})).status, 422);
check("unknown member -> 404", (await req("POST", "/admin/api/subscriptions", { memberId: "nope", planId: PLAN_PRO_MONTHLY })).status, 404);
check("unknown plan -> 404", (await req("POST", "/admin/api/subscriptions", { memberId: lead.id, planId: "nope" })).status, 404);

console.log("\n6. RENEW EARLY (must not lose days)");
const renewed = await req("PATCH", `/admin/api/subscriptions/${subId}`, { action: "renew" });
const E2 = addDays(E1, PRO_DURATION); // starts E1+1, ends E1+30
check("PATCH status", renewed.status, 200);
check("new end = old end + duration", renewed.json?.subscription?.endDate, E2);
check("start = old end + 1", renewed.json?.subscription?.startDate, addDays(E1, 1));
const afterRenew = await req("GET", `/admin/api/members/${lead.id}`);
check("member planEnd follows", afterRenew.json?.member?.planEnd, E2);

console.log("\n7. FREEZE (pause, do not lose paid time)");
const frozen = await req("PATCH", `/admin/api/subscriptions/${subId}`, { action: "freeze", freezeDays: 7 });
const E3 = addDays(E2, 7);
check("PATCH status", frozen.status, 200);
check("end pushed out by freeze", frozen.json?.subscription?.endDate, E3);
check("freezeDays accumulated", frozen.json?.subscription?.freezeDays, 7);
check("status frozen", frozen.json?.subscription?.status, "frozen");
const afterFreeze = await req("GET", `/admin/api/members/${lead.id}`);
check("member planEnd follows", afterFreeze.json?.member?.planEnd, E3);
check("member stage frozen", afterFreeze.json?.member?.stage, "frozen");
check("derived status frozen", afterFreeze.json?.member?.status, "frozen");

console.log("\n8. FREEZE VALIDATION");
check("zero days -> 422", (await req("PATCH", `/admin/api/subscriptions/${subId}`, { action: "freeze", freezeDays: 0 })).status, 422);
check("negative -> 422", (await req("PATCH", `/admin/api/subscriptions/${subId}`, { action: "freeze", freezeDays: -3 })).status, 422);
check("bad action -> 422", (await req("PATCH", `/admin/api/subscriptions/${subId}`, { action: "teleport" })).status, 422);

console.log("\n9. READ");
const list = await req("GET", "/admin/api/subscriptions");
check("list ok", list.status, 200);
check("list includes ours", list.json?.subscriptions?.some((s) => s.id === subId), true);
check("list carries member name", Boolean(list.json?.subscriptions?.find((s) => s.id === subId)?.memberName), true);
check("unknown subscription -> 404", (await req("GET", "/admin/api/subscriptions/nope")).status, 404);


process.exit(report("subs") ? 0 : 1);
