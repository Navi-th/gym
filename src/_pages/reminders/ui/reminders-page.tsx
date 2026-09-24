import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/shared/ui";
import { getAllMembers, type MemberWithStatus } from "@/entities/member";
import { getRules, selectDueForRule, type AutomationRule } from "@/entities/automation";
import {
  buildDedupeKey,
  buildWhatsAppLink,
  getBlockedDedupeKeys,
  getMessages,
  getMessageTemplates,
  missingVariables,
  renderTemplate,
  type MessageTemplate,
} from "@/entities/message";
import { getPlans, planNameById, type Plan } from "@/entities/plan";
import { MessagesTable } from "@/widgets/messages-table";
import { formatDate, formatMoneyCompact, todayUtc } from "@/shared/lib";
import { AutomationRulesCard } from "./automation-rules-card";
import { SendQueue, type SendQueueEntry } from "./send-queue";

/**
 * Turns the enabled rules into one queue of prepared reminders.
 *
 * Assembled here rather than in a module of its own, matching how
 * admin-dashboard and the payments page already collect their own data. The part
 * worth testing — which members a rule selects — lives in entities/automation and
 * is unit tested; this is only the join.
 *
 * Three things are dropped on the way in:
 *  - anyone already handled for this membership, so the list shrinks as you work
 *    instead of showing the same people every day
 *  - any template the member has no value for, because a message reading
 *    "expires on {{date}}" must never reach the screen, let alone WhatsApp
 *  - disabled rules, which must not contribute anybody at all
 */
function buildQueue(input: {
  members: MemberWithStatus[];
  rules: AutomationRule[];
  templates: MessageTemplate[];
  plans: Plan[];
  blockedKeys: Set<string>;
  today: string;
}): SendQueueEntry[] {
  const { members, rules, templates, plans, blockedKeys, today } = input;

  const planNames = planNameById(plans);
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const templateByKey = new Map(templates.map((template) => [template.key, template]));
  const entries: SendQueueEntry[] = [];

  for (const rule of rules) {
    const template = templateByKey.get(rule.templateKey);
    if (!template) continue;

    const due = selectDueForRule({
      trigger: rule.trigger,
      offsetDays: rule.offsetDays,
      people: members,
      today,
    });

    for (const member of due) {
      // `period` is the membership this message is about — which is what makes
      // the key distinguish this term from the member's next one.
      const key = buildDedupeKey({
        memberId: member.id,
        ruleId: rule.id,
        templateKey: template.key,
        period: member.planEnd,
      });
      if (blockedKeys.has(key)) continue;

      const plan = member.planId ? planById.get(member.planId) : undefined;
      const values: Record<string, string> = {
        // First name only: "Hi Aarav" reads like a person wrote it.
        name: member.fullName.trim().split(/\s+/)[0] ?? member.fullName,
        plan: planNames.get(member.planId ?? "") ?? "",
        date: formatDate(member.planEnd),
        code: member.memberCode,
        amount: plan ? formatMoneyCompact(plan.priceCents) : "",
      };

      if (missingVariables(template.body, values).length > 0) continue;

      const rendered = renderTemplate(template.body, values);

      entries.push({
        memberId: member.id,
        memberName: member.fullName,
        memberCode: member.memberCode,
        planEnd: member.planEnd,
        daysLeft: member.daysLeft,
        ruleId: rule.id,
        ruleName: rule.name,
        templateKey: template.key,
        period: member.planEnd,
        rendered,
        link: buildWhatsAppLink(member.phone, rendered),
        whatsappOptIn: member.whatsappOptIn,
      });
    }
  }

  // Most urgent first: whoever lapses soonest is the one to deal with first.
  return entries.sort(
    (a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || a.memberName.localeCompare(b.memberName)
  );
}

async function RemindersContentSection() {
  const today = todayUtc();

  const [members, rules, templates, messages, plans] = await Promise.all([
    getAllMembers(),
    getRules(),
    getMessageTemplates(),
    getMessages({ limit: 50 }),
    getPlans(),
  ]);

  const blockedKeys = new Set(await getBlockedDedupeKeys(members.map((member) => member.id)));

  const entries = buildQueue({
    members,
    rules: rules.filter((rule) => rule.isEnabled),
    templates,
    plans,
    blockedKeys,
    today,
  });

  return (
    <>
      <SendQueue entries={entries} />

      <AutomationRulesCard rules={rules} templates={templates} />

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Mirrors what must be registered with Meta. Utility-category and factual in tone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">{template.key}</span>
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  {template.category}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">{template.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <MessagesTable messages={messages} />
    </>
  );
}

export function RemindersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Reminders</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
          Sends open WhatsApp with the message ready. Consent must be recorded on the member first.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="space-y-4 pt-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        }
      >
        <RemindersContentSection />
      </Suspense>
    </div>
  );
}

