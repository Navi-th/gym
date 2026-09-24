import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, members as membersTable, payments as paymentsTable } from "@/shared/db";
import { newId, todayUtc } from "@/shared/lib";
import { computeRenewalDates, deriveMemberStatus, type MemberStage } from "../model/status";

export async function renewMemberPlan(input: {
  memberId: string;
  planId: string;
  durationDays: number;
  priceCents: number;
  currentEnd?: string | null;
  stage: MemberStage;
  paymentMethod?: "cash" | "upi" | "card" | "bank";
}): Promise<void> {
  const db = getDb();
  const today = todayUtc();
  const status = deriveMemberStatus({ stage: input.stage, planEnd: input.currentEnd });

  const { startDate, endDate } = computeRenewalDates({
    currentEnd: input.currentEnd,
    status,
    durationDays: input.durationDays,
    today,
  });

  const now = new Date().toISOString();
  const paymentId = newId();

  await db.batch([
    db
      .update(membersTable)
      .set({
        planId: input.planId,
        planStart: startDate,
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
      periodStart: startDate,
      periodEnd: endDate,
      createdAt: now,
    }),
  ]);

  revalidateTag("dues-count");
  revalidateTag("members");
  revalidateTag("payments");
  revalidateTag("revenue-totals");
}
