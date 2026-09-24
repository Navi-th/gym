import Link from "next/link";
import {
  Card,
  CardContent,
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
import { billingPeriodLabel, type Plan } from "@/entities/plan";
import { PlanRetireToggle } from "@/features/retire-plan";
import { formatMoneyCompact } from "@/shared/lib";

/**
 * Plans table.
 *
 * Two modes from one component. On the dashboard it is a read-only summary
 * (`manage={false}`); on the plans page it grows an edit link and a retire
 * toggle. Duplicating the table for the second mode would mean two places to
 * update whenever a column changes.
 */
export function PlansTable({ plans, manage = false }: { plans: Plan[]; manage?: boolean }) {
  const columnCount = manage ? 6 : 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="min-w-0">
          <THead>
            <TR>
              <TH>Plan</TH>
              <TH>Billing</TH>
              <TH className="text-right">Price</TH>
              {manage && <TH className="text-right">Days</TH>}
              {manage && <TH>Availability</TH>}
              {manage && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {plans.length === 0 ? (
              <TableMessage colSpan={columnCount}>
                No plans yet. Create one so members can be subscribed.
              </TableMessage>
            ) : (
              plans.map((plan) => (
                <TR key={plan.id} className={plan.isActive ? undefined : "opacity-60"}>
                  <TD className="font-bold text-zinc-900">{plan.name}</TD>
                  <TD className="text-zinc-500 font-medium">
                    {billingPeriodLabel(plan.billingPeriod)}
                  </TD>
                  <TD className="text-right font-black text-zinc-900">
                    {formatMoneyCompact(plan.priceCents)}
                  </TD>
                  {manage && (
                    <TD className="text-right text-zinc-500 font-medium">{plan.durationDays}</TD>
                  )}
                  {manage && (
                    <TD>
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-black ${
                          plan.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-zinc-100 text-zinc-600 border-zinc-300"
                        }`}
                      >
                        {plan.isActive ? "On sale" : "Retired"}
                      </span>
                    </TD>
                  )}
                  {manage && (
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/plans/${plan.id}`}
                          className="text-xs font-black text-black hover:underline"
                        >
                          Edit
                        </Link>
                        <PlanRetireToggle
                          planId={plan.id}
                          planName={plan.name}
                          isActive={plan.isActive}
                        />
                      </div>
                    </TD>
                  )}
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
