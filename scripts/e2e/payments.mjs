/**
 * Payments: record, record-and-renew, arrears, revenue totals.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset
 * and dev server are handled for you.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";
const today = new Date().toISOString().slice(0, 10);

console.log("1. SEEDED LEDGER");
const list = await req("GET", "/admin/api/payments");
check("status", list.status, 200);
check("5 seeded payments", list.json?.count, 5);
check("totals present", typeof list.json?.totals?.allTimeCents, "number");
// 6900 + 6900 + 118800 + 3500 + 6900 = 143000
check("all-time total", list.json?.totals?.allTimeCents, 143000);

console.log("\n2. DUES = LAPSED ONLY");
const members = await req("GET", "/admin/api/members");
const lapsed = members.json.members.filter((m) => m.planEnd && m.planEnd < today);
check("exactly one lapsed member", lapsed.length, 1);
const overdue = lapsed[0];
check("it is PULSE-0004", overdue.memberCode, "PULSE-0004");

console.log("\n3. RECORD A SIMPLE PAYMENT");
const simple = await req("POST", "/admin/api/payments", {
  memberId: members.json.members[0].id, amountCents: 5000, method: "cash", reference: "CASH-1",
});
check("status 201", simple.status, 201);
check("amount", simple.json?.payment?.amountCents, 5000);
check("no subscription touched", simple.json?.subscription, null);
check("total grew to 148000", (await req("GET", "/admin/api/payments")).json?.totals?.allTimeCents, 148000);

console.log("\n4. RECORD + RENEW (the desk flow)");
const payer = await req("GET", `/admin/api/members/${overdue.id}`);
const subs = await req("GET", "/admin/api/subscriptions");
const sub = subs.json.subscriptions.find((s) => s.memberId === overdue.id);
const expectedStart = today;
const expectedEnd = addDays(today, 29); // starter monthly = 30 days
const combo = await req("POST", "/admin/api/payments", {
  memberId: overdue.id, subscriptionId: sub.id, amountCents: 3500, method: "upi", renew: true, reference: "UPI-1",
});
check("status 201", combo.status, 201);
check("payment period start == new cover start", combo.json?.payment?.periodStart, expectedStart);
check("payment period end == new cover end", combo.json?.payment?.periodEnd, expectedEnd);
check("subscription extended", combo.json?.subscription?.endDate, expectedEnd);
const afterPay = await req("GET", `/admin/api/members/${overdue.id}`);
check("member no longer lapsed", afterPay.json?.member?.planEnd, expectedEnd);
check("member status back to active", afterPay.json?.member?.status, "active");

console.log("\n5. VALIDATION");
check("missing member -> 404", (await req("POST", "/admin/api/payments", { amountCents: 100, method: "cash" })).status, 404);
check("unknown member -> 404", (await req("POST", "/admin/api/payments", { memberId: "nope", amountCents: 100, method: "cash" })).status, 404);
check("no amount -> 422", (await req("POST", "/admin/api/payments", { memberId: overdue.id, method: "cash" })).status, 422);
check("zero amount -> 422", (await req("POST", "/admin/api/payments", { memberId: overdue.id, amountCents: 0, method: "cash" })).status, 422);
check("fractional amount -> 422", (await req("POST", "/admin/api/payments", { memberId: overdue.id, amountCents: 69.5, method: "cash" })).status, 422);
check("bad method -> 422", (await req("POST", "/admin/api/payments", { memberId: overdue.id, amountCents: 100, method: "bitcoin" })).status, 422);
check("renew without subscription -> 422", (await req("POST", "/admin/api/payments", { memberId: overdue.id, amountCents: 100, method: "cash", renew: true })).status, 422);
check("unknown subscription -> 404", (await req("POST", "/admin/api/payments", { memberId: overdue.id, subscriptionId: "nope", amountCents: 100, method: "cash", renew: true })).status, 404);

console.log("\n6. PAGE RENDERS");
const page = await fetch(B + "/admin/payments");
const html = await page.text();
check("GET /admin/payments", page.status, 200);
check("  shows revenue tile", html.includes("Collected this month"), true);
check("  shows arrears section", html.includes("In arrears"), true);
check("  shows payment history", html.includes("Payment history"), true);
check("  lists a recorded reference", html.includes("UPI-1"), true);


process.exit(report("payments") ? 0 : 1);
