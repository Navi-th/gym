import { desc, eq } from "drizzle-orm";
import { getDb, members as membersTable, payments as paymentsTable } from "@/shared/db";
import type { Payment } from "../model/types";

export type PaymentWithMember = Payment & {
  memberName: string;
  memberCode: string;
};

/** Recent payments, newest first. */
export async function getPayments(
  options: { limit?: number } = {}
): Promise<PaymentWithMember[]> {
  const db = getDb();

  const query = db
    .select({
      payment: paymentsTable,
      memberName: membersTable.fullName,
      memberCode: membersTable.memberCode,
    })
    .from(paymentsTable)
    .innerJoin(membersTable, eq(paymentsTable.memberId, membersTable.id))
    .orderBy(desc(paymentsTable.paidAt), desc(paymentsTable.createdAt));

  const rows = options.limit ? await query.limit(options.limit) : await query;

  return rows.map((row) => ({
    ...row.payment,
    memberName: row.memberName,
    memberCode: row.memberCode,
  }));
}
