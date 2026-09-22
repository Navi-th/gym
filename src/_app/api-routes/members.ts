import {
  createMember,
  DuplicatePhoneError,
  getMembers,
  validateMemberInput,
  type MemberInput,
  type MemberStatus,
} from "@/entities/member";
import { getPlanById } from "@/entities/plan";
import { assignPlan } from "@/entities/subscription";

/**
 * HTTP layer for the member collection.
 */

/** GET /admin/api/members?q=&status=&page=&pageSize= */
export async function listMembersHandler(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status") as MemberStatus | "all" | null;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || 10);

  const result = await getMembers({ q, status, page, pageSize });

  return Response.json({
    ok: true,
    count: result.totalCount,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    members: result.data,
  });
}

/** POST /admin/api/members */
export async function createMemberHandler(request: Request) {
  let body: Partial<MemberInput> & { planId?: string; startDate?: string };
  try {
    body = (await request.json()) as Partial<MemberInput> & { planId?: string; startDate?: string };
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateMemberInput(body);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  try {
    const member = await createMember(result.value);

    if (body.planId && typeof body.planId === "string") {
      const plan = await getPlanById(body.planId);
      if (plan && plan.isActive) {
        const startDate = typeof body.startDate === "string" && body.startDate.trim() ? body.startDate.trim() : undefined;
        await assignPlan({
          memberId: member.id,
          planId: plan.id,
          durationDays: plan.durationDays,
          priceCents: plan.priceCents,
          startDate,
        });
      }
    }

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

