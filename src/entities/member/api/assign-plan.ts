import { eq } from "drizzle-orm";
import { getDb, members as membersTable, payments as paymentsTable } from "@/shared/db";
import { addDays, newId, todayUtc } from "@/shared/lib";

export async function assignPlanToMember(input: {
  memberId: string;
  planId: string;
  durationDays: number;
  priceCents: number;
  paymentMethod?: "cash" | "upi" | "card" | "bank";
}): Promise<void> {
  const db = getDb();
  const today = todayUtc();
  const endDate = addDays(today, Math.max(0, input.durationDays - 1));

  const now = new Date().toISOString();
  const paymentId = newId();

  await db.batch([
    db
      .update(membersTable)
      .set({
        planId: input.planId,
        planStart: today,
        planEnd: endDate,
        stage: "active",
        updatedAt: now,
      })
      .where(eq(membersTable.id, input.memberId)),

    db.insert(paymentsTable).values({
      id: paymentId,
      memberId: input.memberId,
      amountCents: input.priceCents,
      method: input.paymentMethod ?? "cash",
      paidAt: today,
      periodStart: today,
      periodEnd: endDate,
      createdAt: now,
    }),
  ]);
}
