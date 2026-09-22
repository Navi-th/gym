import { getMemberById } from "@/entities/member";
import { getPlanById } from "@/entities/plan";
import {
  assignPlan,
  getSubscriptions,
  MemberAlreadySubscribedError,
} from "@/entities/subscription";

/**
 * HTTP layer for subscriptions.
 */

/** GET /admin/api/subscriptions?page=&pageSize= */
export async function listSubscriptionsHandler(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || 10);

  const result = await getSubscriptions({ page, pageSize });

  return Response.json({
    ok: true,
    count: result.totalCount,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    subscriptions: result.data,
  });
}

/** POST /admin/api/subscriptions  { memberId, planId, startDate? } */
export async function assignPlanHandler(request: Request) {
  let body: { memberId?: string; planId?: string; startDate?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { memberId, planId, startDate } = body;
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

  try {
    const subscription = await assignPlan({
      memberId: member.id,
      planId: plan.id,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
      startDate,
    });
    return Response.json({ ok: true, subscription }, { status: 201 });
  } catch (error) {
    if (error instanceof MemberAlreadySubscribedError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }
    throw error;
  }
}
