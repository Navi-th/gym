export type SubmitReminderResult =
  | { ok: true; link: string; rendered: string }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function submitReminder(payload: {
  memberId: string;
  templateKey: string;
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
