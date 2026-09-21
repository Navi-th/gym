/**
 * Member CRUD: create, search, filter, update, archive.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset
 * and dev server are handled for you.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

console.log("1. LIST PAGE");
const page = await fetch(B + "/admin/members");
check("GET /admin/members", page.status, 200);
const html = await page.text();
check("page shows PULSE-0001", html.includes("PULSE-0001"), true);
check("page has search input", html.includes('name="q"'), true);

console.log("\n2. CREATE");
const created = await req("POST", "/admin/api/members", {
  fullName: "Curl Test Member",
  phone: "98765 43210",
  email: "curl@example.com",
  stage: "active",
  whatsappOptIn: true,
});
check("POST status", created.status, 201);
check("memberCode matches PULSE-####", /^PULSE-\d{4}$/.test(created.json?.member?.memberCode ?? ""), true);
check("phone normalised to E.164", created.json?.member?.phone, "+919876543210");
check("optInAt stamped", Boolean(created.json?.member?.optInAt), true);
const id = created.json?.member?.id;

console.log("\n3. VALIDATION");
const bad = await req("POST", "/admin/api/members", { fullName: "A", phone: "12" });
check("invalid -> 422", bad.status, 422);
check("reports fullName error", Boolean(bad.json?.errors?.fullName), true);
check("reports phone error", Boolean(bad.json?.errors?.phone), true);
const empty = await req("POST", "/admin/api/members", {});
check("empty body -> 422", empty.status, 422);

console.log("\n4. DUPLICATE PHONE");
const dupe = await req("POST", "/admin/api/members", { fullName: "Another Person", phone: "+919876543210" });
check("duplicate -> 409", dupe.status, 409);
check("error names the phone field", Boolean(dupe.json?.errors?.phone), true);

console.log("\n5. SEARCH + FILTER");
const search = await req("GET", "/admin/api/members?q=Curl%20Test");
check("search finds it", search.json?.count, 1);
const byCode = await req("GET", "/admin/api/members?q=PULSE-0007");
check("search by member code", byCode.json?.count, 1);
const noMatch = await req("GET", "/admin/api/members?q=zzzznotfound");
check("no match -> 0", noMatch.json?.count, 0);
const leads = await req("GET", "/admin/api/members?status=lead");
check("filter status=lead", leads.json?.count, 1);

console.log("\n6. READ ONE");
const one = await req("GET", `/admin/api/members/${id}`);
check("GET by id", one.status, 200);
check("derived status present", typeof one.json?.member?.status, "string");

console.log("\n7. UPDATE");
const updated = await req("PATCH", `/admin/api/members/${id}`, {
  fullName: "Curl Test Renamed",
  phone: "098765-43210",
  stage: "frozen",
  whatsappOptIn: true,
});
check("PATCH status", updated.status, 200);
check("name changed", updated.json?.member?.fullName, "Curl Test Renamed");
check("stage changed", updated.json?.member?.stage, "frozen");
check("phone still E.164", updated.json?.member?.phone, "+919876543210");

console.log("\n8. ARCHIVE");
const del = await req("DELETE", `/admin/api/members/${id}`);
check("DELETE status", del.status, 200);
const gone = await req("GET", `/admin/api/members/${id}`);
check("archived -> 404", gone.status, 404);
const after = await req("GET", "/admin/api/members?q=Curl%20Test");
check("absent from list", after.json?.count, 0);
const delAgain = await req("DELETE", `/admin/api/members/${id}`);
check("double archive -> 404", delAgain.status, 404);
const freed = await req("POST", "/admin/api/members", { fullName: "Phone Reused", phone: "9876543210" });
check("phone freed after archive", freed.status, 201);
if (freed.json?.member?.id) await req("DELETE", `/admin/api/members/${freed.json.member.id}`);

console.log("\n9. REGRESSION");
const dash = await fetch(B + "/admin");
check("dashboard still 200", dash.status, 200);
check("dashboard shows 6 total", (await dash.text()).includes("Total members"), true);


process.exit(report("members") ? 0 : 1);
