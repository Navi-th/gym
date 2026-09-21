import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { formatPhone, getMemberById, MemberStatusBadge } from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import {
  deriveSubscriptionState,
  getActiveSubscription,
  SUBSCRIPTION_STATE_META,
} from "@/entities/subscription";
import { ArchiveMemberButton } from "@/features/archive-member";
import { AssignPlanForm } from "@/features/assign-plan";
import { SubscriptionActions } from "@/features/manage-subscription";
import { MemberForm } from "@/features/save-member";
import { formatDate, formatMoneyCompact } from "@/shared/lib";

/**
 * Add or edit a single member.
 *
 * One page covers both because the form is identical; only the heading, the
 * verb, and whether the archive and subscription sections appear differ.
 */
export async function MemberFormPage({ memberId }: { memberId?: string }) {
  const member = memberId ? await getMemberById(memberId) : null;

  // An id was supplied but no such member — a genuine 404 beats silently
  // rendering an empty add form at a URL that claims to be an edit.
  if (memberId && !member) notFound();

  const plans = await getPlans();
  const planNames = planNameById(plans);

  // Only the RUNNING subscription is relevant here. Historic ones live on the
  // subscriptions page; showing them here would bury the thing being managed.
  const subscription = member ? await getActiveSubscription(member.id) : null;
  const subscriptionState = subscription
    ? SUBSCRIPTION_STATE_META[
        deriveSubscriptionState({
          status: subscription.status,
          endDate: subscription.endDate,
        })
      ]
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <Link
          href="/admin/members"
          className="text-xs font-bold text-slate-500 transition-colors hover:text-white"
        >
          ← Members
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
          {member ? member.fullName : "Add member"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {member ? `Member code ${member.memberCode}` : "Details can be edited later."}
        </p>
      </header>

      {member && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <span className="text-slate-500">
                Phone{" "}
                <span className="ml-1.5 font-semibold text-slate-200">
                  {formatPhone(member.phone)}
                </span>
              </span>
              <span className="text-slate-500">
                Expiry{" "}
                <span className="ml-1.5 font-semibold text-slate-200">
                  {formatDate(member.planEnd)}
                </span>
              </span>
              <MemberStatusBadge status={member.status} />
            </div>
            <ArchiveMemberButton memberId={member.id} memberName={member.fullName} />
          </CardContent>
        </Card>
      )}

      {member && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {subscription
                ? `Covered until ${formatDate(subscription.endDate)}.`
                : "No running subscription. Member status is driven by plan dates, so this member shows as a lead."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription && subscriptionState ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="text-slate-500">
                    Plan{" "}
                    <span className="ml-1.5 font-semibold text-slate-200">
                      {planNames.get(subscription.planId) ?? "—"}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    Current period{" "}
                    <span className="ml-1.5 font-semibold text-slate-200">
                      {formatDate(subscription.startDate)} → {formatDate(subscription.endDate)}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    Renewal price{" "}
                    <span className="ml-1.5 font-semibold text-slate-200">
                      {formatMoneyCompact(subscription.priceCentsCharged)}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${subscriptionState.className}`}
                  >
                    {subscriptionState.label}
                  </span>
                </div>
                <SubscriptionActions subscriptionId={subscription.id} />
              </div>
            ) : (
              <AssignPlanForm memberId={member.id} plans={plans} />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{member ? "Edit details" : "Member details"}</CardTitle>
          <CardDescription>Only the name and phone number are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm mode={member ? "edit" : "create"} member={member ?? undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
