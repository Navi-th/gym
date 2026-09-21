export type ActionInput =
  | { action: "renew" }
  | { action: "freeze"; freezeDays: number };

export type ActionResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

/** Renews or freezes a subscription. Both simply push the end date out. */
export async function submitSubscriptionAction(
  subscriptionId: string,
  input: ActionInput
): Promise<ActionResult> {
  const response = await fetch(`/admin/api/subscriptions/${subscriptionId}`, {
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
