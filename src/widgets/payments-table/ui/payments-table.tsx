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
import { PAYMENT_METHOD_LABELS, type PaymentWithMember } from "@/entities/payment";
import { formatDate, formatMoney, initials } from "@/shared/lib";

/**
 * Payment history.
 *
 * Read-only on purpose. A recorded payment is an audit entry — if a figure is
 * wrong, the correction is another entry, not an edit. Nothing here is
 * clickable because nothing here should be changed.
 */
export function PaymentsTable({ payments }: { payments: PaymentWithMember[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment history</CardTitle>
        <CardDescription>
          Newest first. Amounts are exact — stored as minor units, never floats.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <TR>
              <TH>Member</TH>
              <TH>Paid</TH>
              <TH>Method</TH>
              <TH>Period covered</TH>
              <TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {payments.length === 0 ? (
              <TableMessage colSpan={5}>No payments recorded yet.</TableMessage>
            ) : (
              payments.map((payment) => (
                <TR key={payment.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                        {initials(payment.memberName)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">
                          {payment.memberName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {payment.memberCode}
                        </div>
                      </div>
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-slate-300">
                    {formatDate(payment.paidAt)}
                  </TD>
                  <TD className="text-slate-400">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    {payment.reference && (
                      <div className="text-[11px] text-slate-500">{payment.reference}</div>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-slate-400">
                    {payment.periodStart || payment.periodEnd
                      ? `${formatDate(payment.periodStart)} → ${formatDate(payment.periodEnd)}`
                      : "—"}
                  </TD>
                  <TD className="whitespace-nowrap text-right font-bold text-emerald-300">
                    {formatMoney(payment.amountCents)}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
