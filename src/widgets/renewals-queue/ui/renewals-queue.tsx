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
import { MemberStatusBadge, type MemberWithStatus } from "@/entities/member";
import { formatDate, formatRelativeDays, initials } from "@/shared/lib";

/**
 * Members needing action: expiring within the warning window, plus anyone
 * already lapsed.
 *
 * Paginated at 10 items per page for clean performance.
 */
export function RenewalsQueue({
  members,
  planNameById,
  pageSize = 10,
}: {
  members: MemberWithStatus[];
  planNameById: Map<string, string>;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);

  const totalCount = members.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedMembers = members.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Renewals queue</CardTitle>
          <CardDescription>
            Expiring within 7 days, plus everything already lapsed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Member</TH>
                <TH>Plan</TH>
                <TH>Expiry</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {totalCount === 0 ? (
                <TableMessage colSpan={4}>Nothing needs attention.</TableMessage>
              ) : (
                paginatedMembers.map((m) => (
                  <TR key={m.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-900">
                          {initials(m.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-zinc-900">
                            {m.fullName}
                          </div>
                          <div className="text-[11px] font-semibold text-zinc-500">{m.memberCode}</div>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-zinc-700 font-medium">
                      {m.planId ? planNameById.get(m.planId) ?? "—" : "—"}
                    </TD>
                    <TD>
                      <div className="text-zinc-700 font-medium">{formatDate(m.planEnd)}</div>
                      {m.daysLeft !== null && (
                        <div className="text-[11px] font-semibold text-zinc-500">
                          {formatRelativeDays(m.daysLeft)}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <MemberStatusBadge status={m.status} />
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


