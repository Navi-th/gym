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
import { daysOverdue } from "@/entities/payment";
import { PaymentForm } from "@/features/record-payment";
import { formatDate, formatMoneyCompact, initials } from "@/shared/lib";

export type DueRow = {
  memberId: string;
  memberName: string;
  memberCode: string;
  planEnd: string;
  planName: string;
  planPriceCents: number;
};

export function DuesTable({
  rows,
  today,
  pageSize = 10,
}: {
  rows: DueRow[];
  today: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>In arrears</CardTitle>
          <CardDescription>
            Cover has already ended. Ordered by how long ago, so the longest-lapsed get seen first.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Member</TH>
                <TH>Plan</TH>
                <TH>Lapsed</TH>
                <TH>Owed</TH>
                <TH className="text-right">Record payment</TH>
              </TR>
            </THead>
            <TBody>
              {totalCount === 0 ? (
                <TableMessage colSpan={5}>
                  Nobody is in arrears. Every member is covered.
                </TableMessage>
              ) : (
                paginatedRows.map((row) => {
                  const overdue = daysOverdue(row.planEnd, today);
                  return (
                    <TR key={row.memberId}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-900">
                            {initials(row.memberName)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-zinc-900">
                              {row.memberName}
                            </div>
                            <div className="text-[11px] font-semibold text-zinc-500">{row.memberCode}</div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-zinc-700 font-medium">{row.planName}</TD>
                      <TD>
                        <div className="whitespace-nowrap text-zinc-800 font-medium">
                          {formatDate(row.planEnd)}
                        </div>
                        <div className="text-[11px] font-bold text-rose-600">
                          {overdue} {overdue === 1 ? "day" : "days"} ago
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap font-black text-rose-600">
                        {formatMoneyCompact(row.planPriceCents)}
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end">
                          <PaymentForm
                            memberId={row.memberId}
                            suggestedAmountCents={row.planPriceCents}
                          />
                        </div>
                      </TD>
                    </TR>
                  );
                })
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
