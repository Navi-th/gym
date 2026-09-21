import { getDb, members as membersTable } from "@/shared/db";
import { newId } from "@/shared/lib";
import type { Member } from "../model/types";
import type { ValidMemberInput } from "../model/validate";
import { assertPhoneIsFree } from "./assert-phone-is-free";
import { nextMemberCode } from "./next-member-code";

/**
 * Creates a member and issues their `PULSE-####` code.
 *
 * Plan fields are intentionally left null — a member is created as a person
 * first, and module 5 attaches a subscription separately.
 */
export async function createMember(input: ValidMemberInput): Promise<Member> {
  const db = getDb();

  await assertPhoneIsFree(input.phone);

  const now = new Date().toISOString();
  const memberCode = await nextMemberCode();

  const rows = await db
    .insert(membersTable)
    .values({
      id: newId(),
      memberCode,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      gender: input.gender ?? null,
      dob: input.dob ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      stage: input.stage ?? "lead",
      notes: input.notes ?? null,
      whatsappOptIn: input.whatsappOptIn ?? false,
      optInAt: input.whatsappOptIn ? now : null,
      joinedAt: now,
      // Set explicitly rather than relying on the column default: the default
      // is SQLite's datetime('now') format, and mixing that with ISO strings
      // from app code makes ordering and comparison subtly inconsistent.
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rows[0];
}
