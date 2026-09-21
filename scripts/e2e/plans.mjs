/**
 * Plans: create, partial-patch merge, retire, restore, retired-not-assignable.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset
 * and dev server are handled for you.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

console.log("1. LIST");
const list = await req("GET", "/admin/api/plans");
check("status", list.status, 200);
check("6 active seeded plans", list.json?.count, 6);

console.log("\n2. CREATE");
const created = await req("POST", "/admin/api/plans", {
  name: "Day Pass", priceCents: 50000, billingPeriod: "monthly", durationDays: 1,
});
check("status 201", created.status, 201);
check("name", created.json?.plan?.name, "Day Pass");
check("defaults to on sale", created.json?.plan?.isActive, true);
const planId = created.json?.plan?.id;

console.log("\n3. CREATE VALIDATION");
check("no name -> 422", (await req("POST", "/admin/api/plans", { priceCents: 100, billingPeriod: "monthly", durationDays: 30 })).status, 422);
check("fractional price -> 422", (await req("POST", "/admin/api/plans", { name: "X", priceCents: 69.5, billingPeriod: "monthly", durationDays: 30 })).status, 422);
check("bad period -> 422", (await req("POST", "/admin/api/plans", { name: "X", priceCents: 100, billingPeriod: "weekly", durationDays: 30 })).status, 422);
check("zero duration -> 422", (await req("POST", "/admin/api/plans", { name: "X", priceCents: 100, billingPeriod: "monthly", durationDays: 0 })).status, 422);
const multi = await req("POST", "/admin/api/plans", { name: "", priceCents: -1, billingPeriod: "x", durationDays: 0 });
check("all four errors reported", Object.keys(multi.json?.errors ?? {}).sort().join(","), "billingPeriod,durationDays,name,priceCents");

console.log("\n4. UPDATE (partial merge)");
const priceOnly = await req("PATCH", `/admin/api/plans/${planId}`, { priceCents: 75000 });
check("status", priceOnly.status, 200);
check("price changed", priceOnly.json?.plan?.priceCents, 75000);
check("name preserved by partial patch", priceOnly.json?.plan?.name, "Day Pass");
check("duration preserved", priceOnly.json?.plan?.durationDays, 1);
check("affectedSubscriptions reported as a number", typeof priceOnly.json?.affectedSubscriptions, "number");

console.log("\n5. RETIRE");
const retired = await req("PATCH", `/admin/api/plans/${planId}`, { isActive: false });
check("status", retired.status, 200);
check("isActive false", retired.json?.plan?.isActive, false);
check("still present for admin", (await req("GET", "/admin/api/plans?includeRetired=1")).json?.count, 7);
check("hidden from default list", (await req("GET", "/admin/api/plans")).json?.count, 6);

console.log("\n6. RETIRED PLANS CANNOT BE ASSIGNED");
const members = await req("GET", "/admin/api/members?status=lead");
let leadId = members.json?.members?.[0]?.id;
if (!leadId) {
  const fresh = await req("POST", "/admin/api/members", { fullName: "Plan Probe", phone: "9111000222" });
  leadId = fresh.json?.member?.id;
}
const assignRetired = await req("POST", "/admin/api/subscriptions", { memberId: leadId, planId });
check("retired plan -> 422", assignRetired.status, 422);

console.log("\n7. RESTORE");
check("restore", (await req("PATCH", `/admin/api/plans/${planId}`, { isActive: true })).json?.plan?.isActive, true);
check("back in default list", (await req("GET", "/admin/api/plans")).json?.count, 7);

console.log("\n8. UNKNOWN");
check("404", (await req("PATCH", "/admin/api/plans/nope", { priceCents: 1 })).status, 404);
check("GET 404", (await req("GET", "/admin/api/plans/nope")).status, 404);

console.log("\n9. PAGES RENDER");
const page = await fetch(B + "/admin/plans");
const html = await page.text();
check("GET /admin/plans", page.status, 200);
check("  lists Day Pass", html.includes("Day Pass"), true);
check("  has New plan control", html.includes("New plan"), true);
check("  has Retire control", html.includes("Retire"), true);
check("GET /admin/plans/new", (await fetch(B + "/admin/plans/new")).status, 200);
check("GET /admin/plans/[id]", (await fetch(`${B}/admin/plans/${planId}`)).status, 200);


process.exit(report("plans") ? 0 : 1);
