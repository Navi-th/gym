import { assignPlanToMember, getMemberById } from "@/entities/member";
import { getPlanById } from "@/entities/plan";

/**
 * HTTP layer for plan assignment.
 */

/** POST /admin/api/subscriptions  { memberId, planId } */
export async function assignPlanHandler(request: Request) {
  let body: { memberId?: string; planId?: string; startDate?: string; paymentMethod?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { memberId, planId, startDate, paymentMethod } = body;
  const errors: Record<string, string> = {};
  if (!memberId) errors.memberId = "A member is required.";
  if (!planId) errors.planId = "A plan is required.";
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const [member, plan] = await Promise.all([
    getMemberById(memberId as string),
    getPlanById(planId as string),
  ]);
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }
  if (!plan) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }
  if (!plan.isActive) {
    return Response.json(
      { ok: false, errors: { planId: "That plan is no longer offered." } },
      { status: 422 }
    );
  }

  await assignPlanToMember({
    memberId: member.id,
    planId: plan.id,
    durationDays: plan.durationDays,
    priceCents: plan.priceCents,
    paymentMethod: (paymentMethod === "upi" ? "upi" : "cash") as "cash" | "upi",
    startDate: typeof startDate === "string" ? startDate : undefined,
  });

  return Response.json({ ok: true }, { status: 201 });
}
