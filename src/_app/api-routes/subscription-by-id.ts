import { getPlanById } from "@/entities/plan";
import {
  freezeSubscription,
  getSubscriptionById,
  renewSubscription,
} from "@/entities/subscription";

/** HTTP layer for a single subscription. */

type RouteContext = { params: { id: string } };

/** GET /admin/api/subscriptions/:id */
export async function getSubscriptionHandler(_request: Request, context: RouteContext) {
  const subscription = await getSubscriptionById(context.params.id);
  if (!subscription) {
    return Response.json({ ok: false, error: "Subscription not found." }, { status: 404 });
  }
  return Response.json({ ok: true, subscription });
}

/**
 * PATCH /admin/api/subscriptions/:id
 *
 * Body: { action: "renew" } or { action: "freeze", freezeDays: number }
 *
 * A single endpoint rather than one per verb: both actions do the same thing
 * (push the end date out), and the difference is intent, which the body
 * states explicitly.
 */
export async function updateSubscriptionHandler(request: Request, context: RouteContext) {
  let body: { action?: string; freezeDays?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const existing = await getSubscriptionById(context.params.id);
  if (!existing) {
    return Response.json({ ok: false, error: "Subscription not found." }, { status: 404 });
  }

  // Duration and price come from the plan — the subscription entity cannot
  // look them up itself, so the handler resolves them.
  const plan = await getPlanById(existing.planId);
  if (!plan) {
    return Response.json(
      {
        ok: false,
        error: `The plan this subscription references (${existing.planId}) no longer exists.`,
      },
      { status: 422 }
    );
  }

  if (body.action === "renew") {
    const subscription = await renewSubscription({
      subscriptionId: existing.id,
      durationDays: plan.durationDays,
      priceCents: plan.priceCents,
    });
    return Response.json({ ok: true, subscription });
  }

  if (body.action === "freeze") {
    const freezeDays = Number(body.freezeDays);
    if (!Number.isInteger(freezeDays) || freezeDays <= 0) {
      return Response.json(
        { ok: false, errors: { freezeDays: "Freeze days must be a whole number above zero." } },
        { status: 422 }
      );
    }
    const subscription = await freezeSubscription({
      subscriptionId: existing.id,
      freezeDays,
    });
    if (!subscription) {
      return Response.json({ ok: false, error: "Could not freeze." }, { status: 422 });
    }
    return Response.json({ ok: true, subscription });
  }

  return Response.json(
    { ok: false, error: 'action must be either "renew" or "freeze".' },
    { status: 422 }
  );
}
