import { getMemberById, renewMemberPlan } from "@/entities/member";
import { getPlanById } from "@/entities/plan";

type RouteContext = { params: { id: string } };

export async function updateSubscriptionHandler(request: Request, context: RouteContext) {
  let body: { action?: string; newPlanId?: string; paymentMethod?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const member = await getMemberById(context.params.id);
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }

  const targetPlanId = body.newPlanId ?? member.planId;
  if (!targetPlanId) {
    return Response.json({ ok: false, error: "No plan attached to member." }, { status: 422 });
  }

  const plan = await getPlanById(targetPlanId);
  if (!plan) {
    return Response.json({ ok: false, error: "Plan no longer exists." }, { status: 422 });
  }

  const paymentMethod = (body.paymentMethod === "upi" || body.paymentMethod === "card" || body.paymentMethod === "bank")
    ? body.paymentMethod
    : "cash";

  if (body.action === "renew" || body.action === "change_plan") {
    await renewMemberPlan({
      memberId: member.id,
      planId: plan.id,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
      currentEnd: member.planEnd,
      stage: member.stage,
      paymentMethod,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: 'action must be "renew" or "change_plan"' }, { status: 422 });
}
