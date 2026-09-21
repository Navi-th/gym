import { TBody, TD, TH, THead, TR, Table, TableMessage } from "@/shared/ui";
import {
  deriveSubscriptionState,
  SUBSCRIPTION_STATE_META,
  type SubscriptionWithMember,
} from "@/entities/subscription";
import { SubscriptionActions } from "@/features/manage-subscription";
import { formatDate, formatRelativeDays, initials } from "@/shared/lib";

/**
 * Subscription list with inline renew and freeze.
 *
 * State is DERIVED from the end date, not read from the stored status column —
 * a row still marked "active" whose cover ran out weeks ago is lapsed, and
 * showing it as active is how a gym forgets to chase someone.
 */
export function SubscriptionsTable({
  subscriptions,
  planNameById,
}: {
  subscriptions: SubscriptionWithMember[];
  planNameById: Map<string, string>;
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Member</TH>
          <TH>Plan</TH>
          <TH>Period</TH>
          <TH>Ends</TH>
          <TH>State</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {subscriptions.length === 0 ? (
          <TableMessage colSpan={6}>
            No subscriptions yet. Assign a plan from a member&apos;s page.
          </TableMessage>
        ) : (
          subscriptions.map((sub) => {
            const state = deriveSubscriptionState({
              status: sub.status,
              endDate: sub.endDate,
            });
            const meta = SUBSCRIPTION_STATE_META[state];

            return (
              <TR key={sub.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                      {initials(sub.memberName)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">
                        {sub.memberName}
                      </div>
                      <div className="text-[11px] text-slate-500">{sub.memberCode}</div>
                    </div>
                  </div>
                </TD>
                <TD className="text-slate-300">
                  {planNameById.get(sub.planId) ?? "—"}
                </TD>
                <TD className="whitespace-nowrap text-xs text-slate-400">
                  {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                </TD>
                <TD>
                  <div className="whitespace-nowrap text-slate-300">
                    {formatDate(sub.endDate)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatRelativeDays(sub.daysLeft)}
                  </div>
                </TD>
                <TD>
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </TD>
                <TD className="text-right">
                  {state === "cancelled" ? (
                    <span className="text-xs text-slate-500">—</span>
                  ) : (
                    <div className="flex justify-end">
                      <SubscriptionActions subscriptionId={sub.id} />
                    </div>
                  )}
                </TD>
              </TR>
            );
          })
        )}
      </TBody>
    </Table>
  );
}
