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
import { MessagesTable } from "@/widgets/messages-table";
import { NudgeQueueTable } from "./nudge-queue-table";

async function RemindersContentSection() {
  const [members, templates, messages] = await Promise.all([
    getAllMembers(),
    getMessageTemplates(),
    getMessages({ limit: 50 }),
  ]);

  const queue = selectRenewalsQueue(members);

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
