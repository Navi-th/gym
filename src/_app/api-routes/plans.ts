import { createPlan, getPlans, validatePlanInput, type PlanInput } from "@/entities/plan";

/** HTTP layer for the plan collection. */

/** GET /admin/api/plans  (?includeRetired=1 to include inactive plans) */
export async function listPlansHandler(request: Request) {
  const url = new URL(request.url);
  const includeRetired = url.searchParams.get("includeRetired") === "1";

  const all = await getPlans();
  const plans = includeRetired ? all : all.filter((p) => p.isActive);

  return Response.json({
    ok: true,
    count: plans.length,
    retiredCount: all.length - plans.filter((p) => p.isActive).length,
    plans,
  });
}

/** POST /admin/api/plans */
export async function createPlanHandler(request: Request) {
  let body: Partial<PlanInput>;
  try {
    body = (await request.json()) as Partial<PlanInput>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validatePlanInput(body);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  const plan = await createPlan(result.value);
  return Response.json({ ok: true, plan }, { status: 201 });
}
