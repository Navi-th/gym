import {
  getPlanById,
  setPlanActive,
  updatePlan,
  validatePlanInput,
  type PlanInput,
} from "@/entities/plan";

type RouteContext = { params: { id: string } };

export async function getPlanHandler(_request: Request, context: RouteContext) {
  const plan = await getPlanById(context.params.id);
  if (!plan) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }
  return Response.json({ ok: true, plan });
}

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

  const plan =
    body.isActive === undefined || result.value.isActive === existing.isActive
      ? await updatePlan(context.params.id, result.value)
      : await setPlanActive(context.params.id, result.value.isActive);

  if (!plan) {
    return Response.json({ ok: false, error: "Plan not found." }, { status: 404 });
  }

  return Response.json({ ok: true, plan });
}
