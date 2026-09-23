export type PlanActionInput =
  | { action: "renew"; memberId: string }
  | { action: "change_plan"; memberId: string; newPlanId: string };

export type ActionResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function submitPlanAction(input: PlanActionInput): Promise<ActionResult> {
  const response = await fetch(`/admin/api/members/subscriptions/${input.memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; errors?: Record<string, string>; error?: string }
    | null;

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      errors: data?.errors,
      message: data?.error ?? `Request failed with status ${response.status}.`,
    };
  }
  return { ok: true };
}
