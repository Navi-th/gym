import { revalidateTag } from "next/cache";
import { getDb, payments as paymentsTable } from "@/shared/db";
import { newId } from "@/shared/lib";
import type { Payment } from "../model/types";
import type { PaymentInput } from "../model/validate";

export async function recordPayment(input: PaymentInput): Promise<Payment> {
  const db = getDb();

  const rows = await db
    .insert(paymentsTable)
    .values({
      id: newId(),
      memberId: input.memberId,
      amountCents: input.amountCents,
      method: input.method,
      paidAt: input.paidAt,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      createdAt: new Date().toISOString(),
    })
    .returning();

  revalidateTag("payments");
  revalidateTag("revenue-totals");
  revalidateTag("dues-count");

  return rows[0];
}
