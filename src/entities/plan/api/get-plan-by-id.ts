import { eq } from "drizzle-orm";
import { getDb, plans as plansTable } from "@/shared/db";
import type { Plan } from "../model/types";

export async function getPlanById(id: string): Promise<Plan | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(plansTable)
    .where(eq(plansTable.id, id))
    .limit(1);

  return rows[0] ?? null;
}
