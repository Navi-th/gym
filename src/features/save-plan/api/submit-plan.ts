import type { Plan, PlanInput } from "@/entities/plan";

export type SubmitPlanResult =
  | { ok: true; plan: Plan; affectedSubscriptions: number }
  | { ok: false; errors?: Record<string, string>; message?: string };

/** Creates or updates a plan. */
export async function submitPlan(
  mode: "create" | "edit",
  planId: string | undefined,
  payload: PlanInput
): Promise<SubmitPlanResult> {
  const url = mode === "create" ? "/admin/api/plans" : `/admin/api/plans/${planId}`;

  const response = await fetch(url, {
    method: mode === "create" ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; plan?: Plan; affectedSubscriptions?: number; errors?: Record<string, string>; error?: string }
    | null;

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      errors: data?.errors,
      message: data?.error ?? `Request failed with status ${response.status}.`,
    };
  }

  return {
    ok: true,
    plan: data.plan as Plan,
    affectedSubscriptions: data.affectedSubscriptions ?? 0,
  };
}
