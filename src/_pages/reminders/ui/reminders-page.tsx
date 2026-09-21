import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableMessage,
} from "@/shared/ui";
import { getMembers, selectRenewalsQueue } from "@/entities/member";
import { getMessages, getMessageTemplates } from "@/entities/message";
import { getSubscriptions } from "@/entities/subscription";
import { SendReminderButton } from "@/features/send-reminder";
import { MessagesTable } from "@/widgets/messages-table";
import { formatDate, formatRelativeDays, initials, todayUtc } from "@/shared/lib";

/**
 * Reminder workspace: who to contact, what to send, and what has gone out.
 *
 * V1 sends through a `wa.me` link with a human pressing send. That is a real
 * choice, not a placeholder — Meta requires pre-approved templates for
 * business-initiated messages, and building on the API first would mean waiting
 * on that review instead of shipping.
 */
export async function RemindersPage() {
  const today = todayUtc();

  const [members, subscriptions, templates, messages] = await Promise.all([
    getMembers(),
    getSubscriptions(today),
    getMessageTemplates(),
    getMessages({ limit: 50 }),
  ]);

  // The audience: anyone whose cover is ending soon or already over. Leads are
  // deliberately excluded — they have not bought anything to be reminded about.
  const queue = selectRenewalsQueue(members).map((member) => ({
    ...member,
    subscriptionId: subscriptions.find((s) => s.memberId === member.id)?.id ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white">Reminders</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sends open WhatsApp with the message ready — a person presses send. Consent must be
          recorded on the member first, and a duplicate send for the same period is refused.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Who needs a nudge</CardTitle>
          <CardDescription>
            Expiring within 7 days, plus everyone already lapsed. Soonest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Member</TH>
                <TH>Expiry</TH>
                <TH>Consent</TH>
                <TH className="text-right">Send reminder</TH>
              </TR>
            </THead>
            <TBody>
              {queue.length === 0 ? (
                <TableMessage colSpan={4}>Nobody needs a reminder right now.</TableMessage>
              ) : (
                queue.map((member) => (
                  <TR key={member.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                          {initials(member.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {member.memberCode}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <div className="whitespace-nowrap text-slate-300">
                        {formatDate(member.planEnd)}
                      </div>
                      {member.daysLeft !== null && (
                        <div className="text-[11px] text-slate-500">
                          {formatRelativeDays(member.daysLeft)}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          member.whatsappOptIn
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {member.whatsappOptIn ? "Given" : "Not given"}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end">
                        <SendReminderButton
                          memberId={member.id}
                          subscriptionId={member.subscriptionId}
                          templates={templates}
                        />
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Mirrors what must be registered with Meta. Utility-category and factual in tone —
            promotional wording is reclassified or rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{template.key}</span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {template.category}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">{template.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <MessagesTable messages={messages} />
    </div>
  );
}
