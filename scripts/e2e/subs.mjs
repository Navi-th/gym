/**
 * Subscriptions & Plan Actions E2E test.
 * Assign plan, renew plan, change plan validation.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

const PLAN_PRO_MONTHLY = "plan_pro_monthly";
const PRO_DURATION = 30;
const today = new Date().toISOString().slice(0, 10);
const E1 = addDays(today, PRO_DURATION - 1); // first period ends

console.log("1. PICK A LEAD");
const leads = await req("GET", "/admin/api/members?status=lead");
const lead = leads.json?.members?.[0];
check("a lead exists", Boolean(lead), true);
check("lead has no plan end", lead?.planEnd, null);
check("lead derives as lead", lead?.status, "lead");

console.log("\n2. ASSIGN PLAN");
const assigned = await req("POST", "/admin/api/members/subscriptions", {
  memberId: lead.id,
  planId: PLAN_PRO_MONTHLY,
});
check("POST status", assigned.status, 201);

console.log("\n3. MEMBER PROJECTION UPDATED ATOMICALLY");
const afterAssign = await req("GET", `/admin/api/members/${lead.id}`);
check("member planId set", afterAssign.json?.member?.planId, PLAN_PRO_MONTHLY);
check("member planEnd set", afterAssign.json?.member?.planEnd, E1);
check("stage promoted lead -> active", afterAssign.json?.member?.stage, "active");
check("derived status now active", afterAssign.json?.member?.status, "active");

console.log("\n4. VALIDATION");
check("missing ids -> 422", (await req("POST", "/admin/api/members/subscriptions", {})).status, 422);
check("unknown member -> 404", (await req("POST", "/admin/api/members/subscriptions", { memberId: "nope", planId: PLAN_PRO_MONTHLY })).status, 404);
check("unknown plan -> 404", (await req("POST", "/admin/api/members/subscriptions", { memberId: lead.id, planId: "nope" })).status, 404);

console.log("\n5. RENEW EARLY (must not lose days)");
const renewed = await req("PATCH", `/admin/api/members/subscriptions/${lead.id}`, { action: "renew", paymentMethod: "cash" });
const E2 = addDays(E1, PRO_DURATION);
check("PATCH status", renewed.status, 200);
const afterRenew = await req("GET", `/admin/api/members/${lead.id}`);
check("member planEnd follows", afterRenew.json?.member?.planEnd, E2);

console.log("\n6. INVALID ACTION");
check("bad action -> 422", (await req("PATCH", `/admin/api/members/subscriptions/${lead.id}`, { action: "teleport" })).status, 422);

process.exit(report("subs") ? 0 : 1);
