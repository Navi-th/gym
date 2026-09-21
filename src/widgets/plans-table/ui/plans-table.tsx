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
} from "@/shared/ui";
import { billingPeriodLabel, type Plan } from "@/entities/plan";
import { formatMoneyCompact } from "@/shared/lib";

/** Read-only plan list. Editing arrives with module 5. */
export function PlansTable({ plans }: { plans: Plan[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans on offer</CardTitle>
        <CardDescription>
          Price shown is the amount charged per billing period.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-0">
          <THead>
            <TR>
              <TH>Plan</TH>
              <TH>Billing</TH>
              <TH className="text-right">Price</TH>
            </TR>
          </THead>
          <TBody>
            {plans.map((p) => (
              <TR key={p.id}>
                <TD className="font-semibold text-white">{p.name}</TD>
                <TD className="text-slate-400">{billingPeriodLabel(p.billingPeriod)}</TD>
                <TD className="text-right font-bold text-rose-300">
                  {formatMoneyCompact(p.priceCents)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
