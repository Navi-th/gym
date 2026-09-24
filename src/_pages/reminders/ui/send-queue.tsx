"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { SendReminderActions, type ReminderTarget } from "@/features/send-reminder";
import { formatDate, formatRelativeDays, initials } from "@/shared/lib";

/** One prepared reminder: who, why, and the message already rendered for them. */
export type SendQueueEntry = ReminderTarget & {
  memberCode: string;
  planEnd: string | null;
  daysLeft: number | null;
  /** The rule that put this member in the queue — shown, so the reason is visible. */
  ruleName: string;
  rendered: string;
};

/**
 * The send queue, one reminder at a time.
 *
 * A table with a row per member asked the admin to choose a message for each
 * person and gave no sense of who had already been dealt with. The rule has
 * already chosen the message and the list already excludes anyone handled this
 * term, so the only decision left is send or skip.
 *
 * Deliberately NOT refreshed between members: a refresh recomputes the queue and
 * would move the next person out from under the cursor. It refreshes once at the
 * end, when the server can drop everything now handled.
 */
export function SendQueue({ entries }: { entries: SendQueueEntry[] }) {
  const router = useRouter();
  const [handled, setHandled] = useState(0);

  const total = entries.length;
  const current = entries[handled];

  function advance() {
    const next = handled + 1;
    setHandled(next);
    if (next >= total) router.refresh();
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s reminders</CardTitle>
          <CardDescription>
            Nobody is due. Everyone inside a rule&apos;s window has already been messaged for their
            current membership.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s reminders</CardTitle>
          <CardDescription>All {total} handled. The queue is clear.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s reminders</CardTitle>
            <CardDescription>
              Send opens WhatsApp with the message ready. Skip records that you passed on this
              person.
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-[11px] font-black text-zinc-700">
            {handled + 1} of {total}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-black text-zinc-900">
            {initials(current.memberName)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-zinc-900">
              {current.memberName}
            </div>
            <div className="text-[11px] font-semibold text-zinc-500">
              {current.memberCode} · expires {formatDate(current.planEnd)}
              {current.daysLeft !== null ? ` · ${formatRelativeDays(current.daysLeft)}` : ""}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
            {current.ruleName}
          </div>
          <p className="mt-1.5 text-xs text-zinc-800">{current.rendered}</p>
        </div>

        <SendReminderActions target={current} onHandled={advance} />
      </CardContent>
    </Card>
  );
}
