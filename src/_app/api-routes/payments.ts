import { getMemberById } from "@/entities/member";
import {
  getPayments,
  getRevenueTotals,
  recordPayment,
  validatePaymentInput,
  type PaymentInput,
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

/**
 * POST /admin/api/payments
 */
export async function recordPaymentHandler(request: Request) {
  let body: Partial<PaymentInput>;
  try {
    body = (await request.json()) as Partial<PaymentInput>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const member = body.memberId ? await getMemberById(body.memberId) : null;
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }

  const result = validatePaymentInput(body);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  const payment = await recordPayment(result.value);

  return Response.json({ ok: true, payment }, { status: 201 });
}
