export type AssignResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

/** Starts a subscription for a member. */
export async function submitAssignPlan(payload: {
  memberId: string;
  planId: string;
  startDate?: string;
}): Promise<AssignResult> {
  const response = await fetch("/admin/api/members/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
