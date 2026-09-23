import {
  getPayments,
  getRevenueTotals,
} from "@/entities/payment";
import { todayUtc } from "@/shared/lib";

/** HTTP layer for payments. */

/** GET /admin/api/payments (?page=1&pageSize=10) */
export async function listPaymentsHandler(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize")) || Number(url.searchParams.get("limit")) || 10);

  const [paymentsResult, totals] = await Promise.all([
    getPayments({ page, pageSize }),
    getRevenueTotals(todayUtc().slice(0, 7)),
  ]);

  return Response.json({
    ok: true,
    count: paymentsResult.totalCount,
    page: paymentsResult.page,
    pageSize: paymentsResult.pageSize,
    totalPages: paymentsResult.totalPages,
    totals,
    payments: paymentsResult.data,
  });
}

