import { sql } from "drizzle-orm";
import { counters, getDb } from "@/shared/db";

/**
 * Issues the next `PULSE-0001` style member code.
 *
 * This is a single atomic UPSERT rather than a read-then-write, so two
 * simultaneous sign-ups can never be handed the same code. It is safe without
 * explicit locking because D1 is single-writer per database.
 *
 * The `INSERT ... ON CONFLICT DO UPDATE` also seeds the counter row if it is
 * missing, so this works on a database that was never seeded.
 */
export async function nextMemberCode(): Promise<string> {
  const db = getDb();

  const rows = await db
    .insert(counters)
    .values({ name: "member_code", value: 1 })
    .onConflictDoUpdate({
      target: counters.name,
      set: { value: sql`${counters.value} + 1` },
    })
    .returning({ value: counters.value });

  const n = rows[0]?.value ?? 1;
  return `PULSE-${String(n).padStart(4, "0")}`;
}
