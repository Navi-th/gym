export type SubmitReminderResult =
  | { ok: true; link: string; rendered: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

/**
 * Renders and logs a reminder, and gets back the link to open.
 *
 * The server does the rendering so that the text written to the ledger is
 * byte-identical to the text the link will send. Rendering in the browser would
 * let those two drift apart.
 */
export async function submitReminder(payload: {
  memberId: string;
  templateKey: string;
  subscriptionId?: string | null;
}): Promise<SubmitReminderResult> {
  const response = await fetch("/admin/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; link?: string; rendered?: string; errors?: Record<string, string>; error?: string }
    | null;

  if (!response.ok || !data?.ok || !data.link) {
    return {
      ok: false,
      errors: data?.errors,
      message: data?.error ?? `Request failed with status ${response.status}.`,
    };
  }

  return { ok: true, link: data.link, rendered: data.rendered ?? "" };
}
