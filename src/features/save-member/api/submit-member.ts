import type { Member } from "@/entities/member";

/**
 * Sends a create or update request for a member.
 *
 * Kept out of the component so the request shape is testable on its own and
 * the form is only responsible for rendering and local state.
 */
export type SubmitResult =
  | { ok: true; member: Member }
  | { ok: false; errors?: Record<string, string>; message?: string };

export async function submitMember(
  mode: "create" | "edit",
  memberId: string | undefined,
  payload: Record<string, unknown>
): Promise<SubmitResult> {
  const url = mode === "create" ? "/admin/api/members" : `/admin/api/members/${memberId}`;

  const response = await fetch(url, {
    method: mode === "create" ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; member?: Member; errors?: Record<string, string>; error?: string }
    | null;

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      errors: data?.errors,
      message: data?.error ?? `Request failed with status ${response.status}.`,
    };
  }

  return { ok: true, member: data.member as Member };
}
