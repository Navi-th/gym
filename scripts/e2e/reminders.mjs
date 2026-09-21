/**
 * Reminders: render, wa.me link, dedupe guard, consent enforcement.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset
 * and dev server are handled for you.
 */
import { addDays, BASE as B, check, req, report } from "./lib/harness.mjs";

console.log("1. LEDGER AND TEMPLATES");
const list = await req("GET", "/admin/api/messages");
check("status", list.status, 200);
check("no messages sent yet", list.json?.count, 0);
check("4 seeded templates", list.json?.templates?.length, 4);

console.log("\n2. WHO NEEDS A NUDGE");
const members = await req("GET", "/admin/api/members");
const today = new Date().toISOString().slice(0, 10);
const soon = members.json.members.filter((m) => m.status === "expiring_soon");
const lapsed = members.json.members.filter((m) => m.status === "expired");
check("one expiring soon", soon.length, 1);
check("one lapsed", lapsed.length, 1);
check("the expiring one is PULSE-0002", soon[0].memberCode, "PULSE-0002");
check("it has consented", soon[0].whatsappOptIn, true);
const target = soon[0];

console.log("\n3. RENDER AND SEND");
const sent = await req("POST", "/admin/api/messages", { memberId: target.id, templateKey: "expiry_7d" });
check("status 201", sent.status, 201);
const expected = "Hi Test, your Pro Athlete Pass membership expires on 26 Sep 2026. Reply here to renew.";
check("rendered body", sent.json?.rendered, expected);
check("stored body matches what will be sent", sent.json?.message?.renderedBody, expected);
check("link strips the leading + (wa.me cannot use it)", sent.json?.link?.startsWith("https://wa.me/919000000002?text="), true);
check("link carries the encoded body", sent.json?.link?.includes("Hi%20Test%2C"), true);
check("logged as sent", sent.json?.message?.status, "sent");

console.log("\n4. THE ANTI-DUPLICATE GUARD");
const dupe = await req("POST", "/admin/api/messages", { memberId: target.id, templateKey: "expiry_7d" });
check("same template again -> 409", dupe.status, 409);
const other = await req("POST", "/admin/api/messages", { memberId: target.id, templateKey: "expiry_1d" });
check("a DIFFERENT template still sends", other.status, 201);
check("ledger now has 2", (await req("GET", "/admin/api/messages")).json?.count, 2);

console.log("\n5. CONSENT IS ENFORCED SERVER-SIDE");
const noConsent = members.json.members.find((m) => !m.whatsappOptIn && m.planEnd);
const refused = await req("POST", "/admin/api/messages", { memberId: noConsent.id, templateKey: "expiry_7d" });
check("no consent -> 422", refused.status, 422);
console.log(`        (refused: ${noConsent.memberCode})`);

console.log("\n6. VALIDATION");
check("no member -> 422", (await req("POST", "/admin/api/messages", { templateKey: "expiry_7d" })).status, 422);
check("no template -> 422", (await req("POST", "/admin/api/messages", { memberId: target.id })).status, 422);
check("unknown member -> 404", (await req("POST", "/admin/api/messages", { memberId: "nope", templateKey: "expiry_7d" })).status, 404);
check("unknown template -> 404", (await req("POST", "/admin/api/messages", { memberId: target.id, templateKey: "nope" })).status, 404);

console.log("\n7. PAGE RENDERS");
const page = await fetch(B + "/admin/reminders");
const html = await page.text();
check("GET /admin/reminders", page.status, 200);
check("  shows the queue", html.includes("Who needs a nudge"), true);
check("  shows templates", html.includes("Templates"), true);
check("  shows the ledger", html.includes("Sent messages"), true);
check("  shows the consent column", html.includes("Consent"), true);
check("  marks consent as given for the queued members", html.includes("Given"), true);
check("  shows the sent message", html.includes("Reply here to renew"), true);

console.log("\n8. ROOT REDIRECTS INTO THE ADMIN");
const root = await fetch(B + "/");
check("GET / returns 200 after redirect", root.status, 200);
check("  and lands on the dashboard", (await root.text()).includes("Dashboard"), true);

console.log("\n9. NO DANGLING SIDEBAR LINKS");
for (const path of ["/admin", "/admin/members", "/admin/plans", "/admin/subscriptions", "/admin/payments", "/admin/reminders"]) {
  const r = await fetch(B + path);
  check(`  ${path}`, r.status, 200);
}


process.exit(report("reminders") ? 0 : 1);
