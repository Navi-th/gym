export type SubmitPaymentResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function submitPayment(payload: {
  memberId: string;
  amountCents: number;
  method: string;
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
