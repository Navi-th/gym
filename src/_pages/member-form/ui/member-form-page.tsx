import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BackButton,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { formatPhone, getMemberById, MemberStatusBadge } from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { ArchiveMemberButton } from "@/features/archive-member";
import { AssignPlanForm } from "@/features/assign-plan";
import { MemberPlanActions } from "@/features/manage-subscription";
import { MemberForm } from "@/features/save-member";
import { formatDate, formatMoneyCompact } from "@/shared/lib";

/**
 * Add or edit a single member.
 */
export async function MemberFormPage({ memberId }: { memberId?: string }) {
  const member = memberId ? await getMemberById(memberId) : null;

  if (memberId && !member) notFound();

  const plans = await getPlans();
  const planNames = planNameById(plans);
  const currentPlan = member?.planId ? plans.find((p) => p.id === member.planId) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <BackButton href="/admin/members" label="Members" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            {member ? member.fullName : "Add member"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {member ? `Member code ${member.memberCode}` : "Details can be edited later."}
          </p>
        </div>
      </header>

      {member && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <span className="text-zinc-500 font-medium">
                Phone{" "}
                <span className="ml-1.5 font-bold text-zinc-900">
                  {formatPhone(member.phone)}
                </span>
              </span>
              <span className="text-zinc-500 font-medium">
                Expiry{" "}
                <span className="ml-1.5 font-bold text-zinc-900">
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
            <CardTitle>Plan & Membership</CardTitle>
            <CardDescription>
              {member.planEnd
                ? `Covered until ${formatDate(member.planEnd)}.`
                : "No active plan attached."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {member.planId && currentPlan ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="text-zinc-500 font-medium">
                    Plan{" "}
                    <span className="ml-1.5 font-bold text-zinc-900">
                      {currentPlan.name}
                    </span>
                  </span>
                  <span className="text-zinc-500 font-medium">
                    Period{" "}
                    <span className="ml-1.5 font-bold text-zinc-900">
                      {formatDate(member.planStart)} → {formatDate(member.planEnd)}
                    </span>
                  </span>
                  <span className="text-zinc-500 font-medium">
                    Price{" "}
                    <span className="ml-1.5 font-bold text-zinc-900">
                      {formatMoneyCompact(currentPlan.priceCents)}
                    </span>
                  </span>
                  <MemberStatusBadge status={member.status} />
                </div>
                <MemberPlanActions
                  memberId={member.id}
                  currentPlanId={member.planId}
                  status={member.status}
                  plans={plans}
                />
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
          <MemberForm mode={member ? "edit" : "create"} member={member ?? undefined} plans={plans} />
        </CardContent>
      </Card>
    </div>
  );
}
