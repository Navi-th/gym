import {
  createMember,
  DuplicatePhoneError,
  getMembers,
  validateMemberInput,
  type MemberInput,
  type MemberStatus,
} from "@/entities/member";

/**
 * HTTP layer for the member collection.
 *
 * These handlers parse requests, validate, and translate domain errors into
 * status codes. All database work belongs to the entity layer — nothing here
 * touches Drizzle.
 */

/** GET /admin/api/members?q=&status= */
export async function listMembersHandler(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status") as MemberStatus | "all" | null;

  const members = await getMembers({ q, status });
  return Response.json({ ok: true, count: members.length, members });
}

/** POST /admin/api/members */
export async function createMemberHandler(request: Request) {
  let body: Partial<MemberInput>;
  try {
    body = (await request.json()) as Partial<MemberInput>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateMemberInput(body);
  if (!result.ok) {
    // 422 rather than 400: the JSON parsed fine, the values are wrong. The
    // errors object is keyed by field so the form can highlight inputs.
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  try {
    const member = await createMember(result.value);
    return Response.json({ ok: true, member }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return Response.json(
        { ok: false, errors: { phone: error.message } },
        { status: 409 }
      );
    }
    throw error;
  }
}
