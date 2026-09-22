import { getMemberById } from "@/entities/member";
import { getPlanById } from "@/entities/plan";
import {
  getPayments,
  getRevenueTotals,
  recordPayment,
  validatePaymentInput,
  type PaymentInput,
} from "@/entities/payment";
import { getSubscriptionById, renewSubscription } from "@/entities/subscription";
import { todayUtc } from "@/shared/lib";

/** HTTP layer for payments. */

/** GET /admin/api/payments  (?page=1&pageSize=10) */
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
  let body: Partial<PaymentInput> & { renew?: boolean };
  try {
    body = (await request.json()) as Partial<PaymentInput> & { renew?: boolean };
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const member = body.memberId ? await getMemberById(body.memberId) : null;
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }

  let periodStart = body.periodStart ?? null;
  let periodEnd = body.periodEnd ?? null;
  let subscriptionId = body.subscriptionId ?? null;
  let renewedSubscription = null;

  if (body.renew) {
    if (!subscriptionId) {
      return Response.json(
        { ok: false, errors: { subscriptionId: "Renewing needs a subscription to renew." } },
        { status: 422 }
      );
    }

    const existing = await getSubscriptionById(subscriptionId);
    if (!existing) {
      return Response.json({ ok: false, error: "Subscription not found." }, { status: 404 });
    }

    const plan = await getPlanById(existing.planId);
    if (!plan) {
      return Response.json(
        { ok: false, error: "The plan for this subscription no longer exists." },
        { status: 422 }
      );
    }

    renewedSubscription = await renewSubscription({
      subscriptionId: existing.id,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
    });

    if (renewedSubscription) {
      periodStart = renewedSubscription.startDate;
      periodEnd = renewedSubscription.endDate;
      subscriptionId = renewedSubscription.id;
    }
  }

  const result = validatePaymentInput({
    ...body,
    subscriptionId,
    periodStart,
    periodEnd,
  });
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  const payment = await recordPayment(result.value);

  return Response.json(
    { ok: true, payment, subscription: renewedSubscription },
    { status: 201 }
  );
}
