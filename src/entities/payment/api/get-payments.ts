import { cache } from "react";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, members as membersTable, payments as paymentsTable } from "@/shared/db";
import { type PaginatedResult } from "@/shared/lib";
import type { Payment } from "../model/types";

export type PaymentWithMember = Payment & {
  memberName: string;
  memberCode: string;
};

export type PaymentFilter = {
  page?: number;
  pageSize?: number;
  limit?: number;
};

const getPaymentsCached = cache(
  async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<PaymentWithMember>> => {
    const db = getDb();

    // 1. Total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentsTable)
      .innerJoin(membersTable, eq(paymentsTable.memberId, membersTable.id));

    const totalCount = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    // 2. Fetch paginated rows
    const rows = await db
      .select({
        payment: paymentsTable,
        memberName: membersTable.fullName,
        memberCode: membersTable.memberCode,
      })
      .from(paymentsTable)
      .innerJoin(membersTable, eq(paymentsTable.memberId, membersTable.id))
      .orderBy(desc(paymentsTable.paidAt), desc(paymentsTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data: PaymentWithMember[] = rows.map((row) => ({
      ...row.payment,
      memberName: row.memberName,
      memberCode: row.memberCode,
    }));

    return {
      data,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
    };
  }
);

/** Payments, paginated (10 per page by default), newest first. */
export async function getPayments(
  options: PaymentFilter = {}
): Promise<PaginatedResult<PaymentWithMember>> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? options.limit ?? 10);

  return getPaymentsCached(page, pageSize);
}

/** Fetch all payments (unpaginated), used for export or totals. */
export async function getAllPayments(): Promise<PaymentWithMember[]> {
  const db = getDb();
  const rows = await db
    .select({
      payment: paymentsTable,
      memberName: membersTable.fullName,
      memberCode: membersTable.memberCode,
    })
    .from(paymentsTable)
    .innerJoin(membersTable, eq(paymentsTable.memberId, membersTable.id))
    .orderBy(desc(paymentsTable.paidAt), desc(paymentsTable.createdAt));

  return rows.map((row) => ({
    ...row.payment,
    memberName: row.memberName,
    memberCode: row.memberCode,
  }));
}
