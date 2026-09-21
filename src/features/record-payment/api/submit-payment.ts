export type SubmitPaymentResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

/**
 * Records a payment, optionally extending cover in the same action.
 *
 * Money and cover are recorded together because that is how it happens at the
 * desk: a member hands over cash and their membership moves forward. Making
 * staff do those as two separate clicks is how one of them gets forgotten.
 */
export async function submitPayment(payload: {
  memberId: string;
  subscriptionId?: string | null;
  amountCents: number;
  method: string;
  paidAt?: string;
  reference?: string | null;
  renew?: boolean;
}): Promise<SubmitPaymentResult> {
  const response = await fetch("/admin/api/payments", {
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
