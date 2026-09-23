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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-900">
                        {initials(payment.memberName)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-zinc-900">
                          {payment.memberName}
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-500">
                          {payment.memberCode}
                        </div>
                      </div>
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-zinc-800 font-medium">
                    {formatDate(payment.paidAt)}
                  </TD>
                  <TD className="text-zinc-700 font-medium">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-zinc-600 font-medium">
                    {payment.periodStart || payment.periodEnd
                      ? `${formatDate(payment.periodStart)} → ${formatDate(payment.periodEnd)}`
                      : "—"}
                  </TD>
                  <TD className="whitespace-nowrap text-right font-black text-emerald-700">
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
