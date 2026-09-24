export type SubmitReminderResult =
  | { ok: true }
  | { ok: false; errors?: Record<string, string>; message?: string };

/**
 * Reports the OUTCOME of a reminder to the ledger.
 *
 * This does not send anything. The caller has already opened the `wa.me` link
 * the page prepared, and the only thing left is to record what happened. That
 * ordering is the point: the ledger is never written on the strength of an
 * intention, which is how it previously came to claim messages nobody sent.
 */
export async function submitReminder(payload: {
  memberId: string;
  templateKey: string;
  ruleId?: string | null;
  period?: string | null;
  status: "sent" | "skipped";
}): Promise<SubmitReminderResult> {
  const response = await fetch("/admin/api/messages", {
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
