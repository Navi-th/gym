import { getDb, payments as paymentsTable } from "@/shared/db";
import { newId } from "@/shared/lib";
import type { Payment } from "../model/types";
import type { PaymentInput } from "../model/validate";

/**
 * Records a payment that has already been taken.
 *
 * This writes money IN, it does not move money — there is no gateway here, by
 * design. Staff record what actually happened (cash in the till, a UPI
 * transfer, a card machine slip), and the row is an audit entry that cannot be
 * changed afterwards.
 */
export async function recordPayment(input: PaymentInput): Promise<Payment> {
  const db = getDb();

  const rows = await db
    .insert(paymentsTable)
    .values({
      id: newId(),
      memberId: input.memberId,
      subscriptionId: input.subscriptionId,
      amountCents: input.amountCents,
      method: input.method,
      paidAt: input.paidAt,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      reference: input.reference,
      note: input.note,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return rows[0];
}
