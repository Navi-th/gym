import { desc, eq } from "drizzle-orm";
import { getDb, payments as paymentsTable } from "@/shared/db";
import type { Payment } from "../model/types";

/** A member's payment history, newest first. */
export async function getMemberPayments(memberId: string): Promise<Payment[]> {
  const db = getDb();

  return db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.memberId, memberId))
    .orderBy(desc(paymentsTable.paidAt), desc(paymentsTable.createdAt));
}
