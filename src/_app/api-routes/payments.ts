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

/** GET /admin/api/payments  (?limit=50) */
export async function listPaymentsHandler(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : 100;

  const [payments, totals] = await Promise.all([
    getPayments({ limit }),
    getRevenueTotals(todayUtc().slice(0, 7)),
  ]);

  return Response.json({ ok: true, count: payments.length, totals, payments });
}

/**
 * POST /admin/api/payments
 *
 * Body: { memberId, amountCents, method, paidAt?, subscriptionId?, renew?,
 *         periodStart?, periodEnd?, reference?, note? }
 *
 * With `renew: true` this does two things: extends cover, then records the
 * money. Those are two sequential writes and NOT one transaction, which is a
 * deliberate, documented trade-off rather than an oversight:
 *
 *   - Extend first, then record. If the second write fails, the member has
 *     cover but no payment row — visible on the payments page and easy for
 *     staff to re-record.
 *   - The reverse order would risk taking money and recording it while the
 *     member is locked out of a gym they just paid for.
 *
 * Of the two possible half-states, this is the one that does not hurt the
 * member. Making it genuinely atomic needs a single combined operation living
 * in one entity, which is the natural next step if this flow grows.
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

    // Stamp the payment with the period it just bought, so the money and the
    // cover it paid for line up in the ledger.
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
