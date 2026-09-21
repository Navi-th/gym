import { getDb, plans as plansTable } from "@/shared/db";
import { newId } from "@/shared/lib";
import type { Plan } from "../model/types";
import type { PlanInput } from "../model/validate";

export async function createPlan(input: PlanInput): Promise<Plan> {
  const db = getDb();

  const rows = await db
    .insert(plansTable)
    .values({
      id: newId(),
      name: input.name,
      priceCents: input.priceCents,
      billingPeriod: input.billingPeriod,
      durationDays: input.durationDays,
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return rows[0];
}
