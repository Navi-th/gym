import { and, eq, isNull } from "drizzle-orm";
import { getDb, members as membersTable } from "@/shared/db";
import type { Member } from "../model/types";
import type { ValidMemberInput } from "../model/validate";
import { assertPhoneIsFree } from "./assert-phone-is-free";
import { getMemberById } from "./get-member-by-id";

/**
 * Updates an existing member.
 *
 * Returns null when the member does not exist or is already archived, so the
 * caller can answer 404 rather than silently creating nothing.
 */
export async function updateMember(
  id: string,
  input: ValidMemberInput
): Promise<Member | null> {
  const db = getDb();

  const existing = await getMemberById(id);
  if (!existing) return null;

  // Passing `id` means a member keeping their own number does not collide
  // with themselves.
  await assertPhoneIsFree(input.phone, id);

  const now = new Date().toISOString();

  const rows = await db
    .update(membersTable)
    .set({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      gender: input.gender ?? null,
      dob: input.dob ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      stage: input.stage ?? existing.stage,
      notes: input.notes ?? null,
      whatsappOptIn: input.whatsappOptIn ?? false,
      // Preserve the ORIGINAL consent timestamp when consent is merely being
      // kept. Overwriting it on every edit would destroy the record of when
      // the member actually agreed — the thing you need if consent is ever
      // disputed.
      optInAt: input.whatsappOptIn ? existing.optInAt ?? now : null,
      updatedAt: now,
    })
    .where(and(eq(membersTable.id, id), isNull(membersTable.deletedAt)))
    .returning();

  return rows[0] ?? null;
}
