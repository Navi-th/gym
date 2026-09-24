"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableMessage,
} from "@/shared/ui";
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
 * The send queue rendered as a full table of due members.
 *
 * Each row displays the member, their plan expiry, reason/rule, message preview,
 * and a direct "Send on WhatsApp" button. Handled rows are removed in real-time.
 */
export function SendQueue({ entries }: { entries: SendQueueEntry[] }) {
  const router = useRouter();
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  const remainingEntries = entries.filter((e) => !handledIds.has(e.memberId));
  const total = entries.length;
  const remainingCount = remainingEntries.length;

  function markHandled(memberId: string) {
    setHandledIds((prev) => {
      const next = new Set(prev);
      next.add(memberId);
      if (next.size >= total) {
        setTimeout(() => router.refresh(), 500);
      }
      return next;
    });
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

  if (remainingCount === 0) {
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s reminders</CardTitle>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800">
            {remainingCount} pending
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <THead>
            <TR>
              <TH>Member</TH>
              <TH>Expiry</TH>
              <TH>Reason</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {remainingEntries.map((entry) => (
              <TR key={`${entry.memberId}-${entry.ruleId}`}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-black text-zinc-900">
                      {initials(entry.memberName)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-extrabold text-zinc-900">
                        {entry.memberName}
                      </div>
                      <div className="text-[11px] font-semibold text-zinc-500">
                        {entry.memberCode}
                      </div>
                    </div>
                  </div>
                </TD>

                <TD>
                  <div className="font-semibold text-zinc-900">
                    {formatDate(entry.planEnd)}
                  </div>
                  {entry.daysLeft !== null && (
                    <div className="text-[11px] font-semibold text-zinc-500">
                      {formatRelativeDays(entry.daysLeft)}
                    </div>
                  )}
                </TD>

                <TD>
                  <span className="inline-block rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-700">
                    {entry.ruleName}
                  </span>
                </TD>

                <TD className="text-right whitespace-nowrap">
                  <SendReminderActions
                    target={entry}
                    onHandled={() => markHandled(entry.memberId)}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

