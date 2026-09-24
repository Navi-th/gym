/**
 * Reminders: the rule-driven queue, per-term dedupe, and an honest ledger.
 *
 * Expects a freshly seeded database. Run via `npm run test:e2e` so the reset and
 * dev server are handled for you.
 *
 * Dates are never manipulated. To land a member inside a rule's window the suite
 * widens the RULE instead — `offsetDays` accepts up to 90 and the seeded 3-month
 * plan ends 89 days out. That is a lever the app already exposes over HTTP, so no
 * test-only backdoor is needed.
 */
import { BASE as B, check, req, report } from "./lib/harness.mjs";

console.log("1. RULES AND TEMPLATES");
const config = await req("GET", "/admin/api/automation-rules");
check("status", config.status, 200);
check("4 seeded rules", config.json?.rules?.length, 4);
check("4 seeded templates", config.json?.templates?.length, 4);

const rule7 = config.json.rules.find((r) => r.id === "rule_expiry_7d");
const welcomeRule = config.json.rules.find((r) => r.trigger === "welcome");
check("the 7-day rule exists", Boolean(rule7), true);
check("  and starts enabled", rule7?.isEnabled, true);

console.log("\n2. A MEMBER WITH A MEMBERSHIP");
const created = await req("POST", "/admin/api/members", {
  fullName: "Reminder Target",
  phone: "+919000000101",
  stage: "active",
  whatsappOptIn: true,
});
check("member created", created.status, 201);
const memberId = created.json?.member?.id;

const assigned = await req("POST", "/admin/api/members/subscriptions", {
  memberId,
  planId: "plan_pro",
});
check("plan assigned", assigned.status, 201);

const withPlan = await req("GET", `/admin/api/members/${memberId}`);
const period = withPlan.json?.member?.planEnd;
check("has a plan end to use as the period", Boolean(period), true);

console.log("\n3. WIDENING THE RULE FILLS THE QUEUE");
const widened = await req("PATCH", `/admin/api/automation-rules/${rule7.id}`, { offsetDays: 90 });
check("PATCH status", widened.status, 200);
check("offset saved", widened.json?.rule?.offsetDays, 90);

const filled = await (await fetch(B + "/admin/reminders")).text();
check("queue names the member", filled.includes("Reminder Target"), true);
check("queue names the rule that flagged them", filled.includes("7 days before expiry"), true);
check("consent is shown as given", filled.includes("Send on WhatsApp"), true);
check("queue is not empty", filled.includes("Nobody is due"), false);

console.log("\n4. COMMITTING AN OUTCOME");
const commit = (over = {}) =>
  req("POST", "/admin/api/messages", {
    memberId,
    templateKey: "expiry_7d",
    ruleId: rule7.id,
    period,
    status: "sent",
    ...over,
  });

check("no status -> 422", (await commit({ status: undefined })).status, 422);
check("unknown status -> 422", (await commit({ status: "teleported" })).status, 422);
check("unknown member -> 404", (await commit({ memberId: "nope" })).status, 404);
check("unknown template -> 404", (await commit({ templateKey: "nope" })).status, 404);

const sent = await commit();
check("sent -> 201", sent.status, 201);
check("recorded as sent", sent.json?.message?.status, "sent");
check(
  "body rendered and stored server-side",
  String(sent.json?.message?.renderedBody ?? "").includes("Reply here to renew"),
  true
);
check("no wa.me link is returned any more", "link" in (sent.json ?? {}), false);


console.log("\n5. THE MEMBER LEAVES THE QUEUE");
const after = await (await fetch(B + "/admin/reminders")).text();
check("queue is now empty", after.includes("Nobody is due"), true);
check("but the ledger still shows the message", after.includes("Reply here to renew"), true);

console.log("\n6. THE DUPLICATE GUARD, PER TERM");
check("the same term again -> 409", (await commit()).status, 409);
check("a DIFFERENT term is allowed -> 201", (await commit({ period: "2099-01-01" })).status, 201);
check("the ledger kept both", (await req("GET", "/admin/api/messages?limit=50")).json?.count, 2);

console.log("\n7. SKIPPING IS RECORDED, AND NEEDS NO CONSENT");
const noConsent = await req("POST", "/admin/api/members", {
  fullName: "No Consent Member",
  phone: "+919000000102",
  stage: "active",
  whatsappOptIn: false,
});
const noConsentId = noConsent.json?.member?.id;
await req("POST", "/admin/api/members/subscriptions", {
  memberId: noConsentId,
  planId: "plan_pro",
});
const noConsentPeriod = (await req("GET", `/admin/api/members/${noConsentId}`)).json?.member?.planEnd;

const identity = {
  memberId: noConsentId,
  templateKey: "expiry_7d",
  ruleId: rule7.id,
  period: noConsentPeriod,
};
check(
  "sending without consent -> 422",
  (await req("POST", "/admin/api/messages", { ...identity, status: "sent" })).status,
  422
);

const skipped = await req("POST", "/admin/api/messages", { ...identity, status: "skipped" });
check("skipping without consent -> 201", skipped.status, 201);
check("recorded as skipped", skipped.json?.message?.status, "skipped");
check("a skip stores no body", skipped.json?.message?.renderedBody, null);
check(
  "a skip still blocks the queue",
  (await (await fetch(B + "/admin/reminders")).text()).includes("Nobody is due"),
  true
);

console.log("\n8. RULE VALIDATION");
const patchRule = (body) => req("PATCH", `/admin/api/automation-rules/${rule7.id}`, body);
check("negative days -> 422", (await patchRule({ offsetDays: -1 })).status, 422);
check("absurd days -> 422", (await patchRule({ offsetDays: 400 })).status, 422);
check("fractional days -> 422", (await patchRule({ offsetDays: 2.5 })).status, 422);
check("empty name -> 422", (await patchRule({ name: "" })).status, 422);
check("unknown template -> 422", (await patchRule({ templateKey: "nope" })).status, 422);
check(
  "unknown rule -> 404",
  (await req("PATCH", "/admin/api/automation-rules/nope", { offsetDays: 3 })).status,
  404
);

const unwired = await req("PATCH", `/admin/api/automation-rules/${welcomeRule.id}`, {
  isEnabled: true,
});
check("enabling an unwired trigger -> 422", unwired.status, 422);
check("  with a readable reason", Boolean(unwired.json?.errors?.isEnabled), true);

const off = await patchRule({ isEnabled: false });
check("switching a wired rule off -> 200", off.status, 200);
check("  and it reads back off", off.json?.rule?.isEnabled, false);
check(
  "a disabled rule contributes nobody",
  (await (await fetch(B + "/admin/reminders")).text()).includes("Nobody is due"),
  true
);

console.log("\n9. PAGE RENDERS");
const page = await fetch(B + "/admin/reminders");
const html = await page.text();
check("GET /admin/reminders", page.status, 200);
check("  shows the rules card", html.includes("Automation rules"), true);
check("  labels the unwired triggers", html.includes("Not wired yet"), true);
check("  shows templates", html.includes("Templates"), true);
check("  shows the ledger", html.includes("Sent messages"), true);

process.exit(report("reminders") ? 0 : 1);
