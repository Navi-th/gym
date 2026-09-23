"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableMessage,
} from "@/shared/ui";
import { SendReminderButton } from "@/features/send-reminder";
import { formatDate, formatRelativeDays, initials } from "@/shared/lib";
import type { MessageTemplate } from "@/entities/message";

export type NudgeMemberRow = {
  id: string;
  fullName: string;
  memberCode: string;
  planEnd: string | null;
  daysLeft: number | null;
  whatsappOptIn: boolean;
};

export function NudgeQueueTable({
  queue,
  templates,
  pageSize = 10,
}: {
  queue: NudgeMemberRow[];
  templates: MessageTemplate[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);

  const totalCount = queue.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedQueue = queue.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
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
              {totalCount === 0 ? (
                <TableMessage colSpan={4}>Nobody needs a reminder right now.</TableMessage>
              ) : (
                paginatedQueue.map((member) => (
                  <TR key={member.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-900">
                          {initials(member.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-zinc-900">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] font-semibold text-zinc-500">
                            {member.memberCode}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <div className="whitespace-nowrap text-zinc-800 font-medium">
                        {formatDate(member.planEnd)}
                      </div>
                      {member.daysLeft !== null && (
                        <div className="text-[11px] font-semibold text-zinc-500">
                          {formatRelativeDays(member.daysLeft)}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-black ${
                          member.whatsappOptIn
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {member.whatsappOptIn ? "Given" : "Not given"}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end">
                        <SendReminderButton
                          memberId={member.id}
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

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
