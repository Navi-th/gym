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
import { daysOverdue } from "@/entities/payment";
import { PaymentForm } from "@/features/record-payment";
import { formatDate, formatMoneyCompact, initials } from "@/shared/lib";

/** Plain row shape so this widget needs no entity types and stays testable. */
export type DueRow = {
  memberId: string;
  memberName: string;
  memberCode: string;
  planEnd: string;
  planName: string;
  subscriptionId: string | null;
  planPriceCents: number;
  planDurationDays: number;
};

/**
 * Members in arrears, with the paying action inline.
 *
 * Recording the payment happens on the row rather than behind a link, because
 * the moment a member is standing at the desk with cash is the only moment
 * this list is actually being used. A list of names you then have to navigate
 * away from is a list staff write on paper instead.
 */
export function DuesTable({ rows, today }: { rows: DueRow[]; today: string }) {
  return (
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
            {rows.length === 0 ? (
              <TableMessage colSpan={5}>
                Nobody is in arrears. Every member is covered.
              </TableMessage>
            ) : (
              rows.map((row) => {
                const overdue = daysOverdue(row.planEnd, today);
                return (
                  <TR key={row.memberId}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                          {initials(row.memberName)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">
                            {row.memberName}
                          </div>
                          <div className="text-[11px] text-slate-500">{row.memberCode}</div>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-slate-300">{row.planName}</TD>
                    <TD>
                      <div className="whitespace-nowrap text-slate-300">
                        {formatDate(row.planEnd)}
                      </div>
                      <div className="text-[11px] text-rose-400">
                        {overdue} {overdue === 1 ? "day" : "days"} ago
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap font-bold text-rose-300">
                      {formatMoneyCompact(row.planPriceCents)}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end">
                        <PaymentForm
                          memberId={row.memberId}
                          subscriptionId={row.subscriptionId}
                          suggestedAmountCents={row.planPriceCents}
                          suggestedDurationDays={row.planDurationDays}
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
  );
}
