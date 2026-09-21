import {
  archiveMember,
  DuplicatePhoneError,
  getMemberById,
  updateMember,
  validateMemberInput,
  type MemberInput,
} from "@/entities/member";

/** HTTP layer for a single member. */

type RouteContext = { params: { id: string } };

/** GET /admin/api/members/:id */
export async function getMemberHandler(_request: Request, context: RouteContext) {
  const member = await getMemberById(context.params.id);
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }
  return Response.json({ ok: true, member });
}

/** PATCH /admin/api/members/:id */
export async function updateMemberHandler(request: Request, context: RouteContext) {
  let body: Partial<MemberInput>;
  try {
    body = (await request.json()) as Partial<MemberInput>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateMemberInput(body);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  try {
    const member = await updateMember(context.params.id, result.value);
    if (!member) {
      return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
    }
    return Response.json({ ok: true, member });
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

/** DELETE /admin/api/members/:id — soft delete (archive). */
export async function archiveMemberHandler(_request: Request, context: RouteContext) {
  const member = await archiveMember(context.params.id);
  if (!member) {
    return Response.json(
      { ok: false, error: "Member not found, or already archived." },
      { status: 404 }
    );
  }
  return Response.json({ ok: true, member });
}
