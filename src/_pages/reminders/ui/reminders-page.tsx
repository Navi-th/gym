import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/shared/ui";
import { getAllMembers, selectRenewalsQueue } from "@/entities/member";
import { getMessages, getMessageTemplates } from "@/entities/message";
import { getAllSubscriptions } from "@/entities/subscription";
import { MessagesTable } from "@/widgets/messages-table";
import { todayUtc } from "@/shared/lib";
import { NudgeQueueTable } from "./nudge-queue-table";

async function RemindersContentSection() {
  const today = todayUtc();

  const [members, subscriptions, templates, messages] = await Promise.all([
    getAllMembers(),
    getAllSubscriptions(today),
    getMessageTemplates(),
    getMessages({ limit: 50 }),
  ]);

  // O(1) Map lookup instead of O(N) array.find in loop
  const subscriptionByMemberId = new Map(subscriptions.map((s) => [s.memberId, s]));

  // The audience: anyone whose cover is ending soon or already over. Leads are
  // deliberately excluded — they have not bought anything to be reminded about.
  const queue = selectRenewalsQueue(members).map((member) => ({
    ...member,
    subscriptionId: subscriptionByMemberId.get(member.id)?.id ?? null,
  }));

  return (
    <>
      <NudgeQueueTable queue={queue} templates={templates} pageSize={10} />

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

/**
 * Reminder workspace.
 */
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
