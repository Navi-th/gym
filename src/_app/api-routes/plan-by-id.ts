import {
  getPlanById,
  setPlanActive,
  updatePlan,
  validatePlanInput,
  type PlanInput,
} from "@/entities/plan";
import { countSubscriptionsForPlan } from "@/entities/subscription";

/** HTTP layer for a single plan. */

type RouteContext = { params: { id: string } };

/** GET /admin/api/plans/:id */
export async function getPlanHandler(_request: Request, context: RouteContext) {
  const plan = await getPlanById(context.params.id);
  if (!plan) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }
  return Response.json({ ok: true, plan });
}

/**
 * PATCH /admin/api/plans/:id
 *
 * Accepts a PARTIAL body and merges it over the stored plan, which makes the
 * same endpoint serve both "edit this plan" and "retire it". A partial is also
 * harder to misuse than a PUT: an edit form that forgets a field cannot blank
 * it out by omission.
 */
export async function updatePlanHandler(request: Request, context: RouteContext) {
  const existing = await getPlanById(context.params.id);
  if (!existing) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }

  let body: Partial<PlanInput>;
  try {
    body = (await request.json()) as Partial<PlanInput>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validatePlanInput({
    name: body.name ?? existing.name,
    priceCents: body.priceCents ?? existing.priceCents,
    billingPeriod: body.billingPeriod ?? existing.billingPeriod,
    durationDays: body.durationDays ?? existing.durationDays,
    isActive: body.isActive ?? existing.isActive,
  });

  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  // Retiring and un-retiring use the same validate-then-write path; setPlanActive
  // exists separately only so the intent is nameable at the call site.
  const plan =
    body.isActive === undefined || result.value.isActive === existing.isActive
      ? await updatePlan(context.params.id, result.value)
      : await setPlanActive(context.params.id, result.value.isActive);

  if (!plan) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }

  // Told to the admin explicitly, because "I changed the duration" is exactly
  // the moment they need to know how many members it does and does not affect.
  const affectedSubscriptions = await countSubscriptionsForPlan(plan.id);

  return Response.json({ ok: true, plan, affectedSubscriptions });
}
