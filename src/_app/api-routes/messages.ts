import { getMemberById } from "@/entities/member";
import {
  DuplicateMessageError,
  getMessages,
  getMessageTemplateByKey,
  getMessageTemplates,
  isSendableBody,
  logMessage,
  missingVariables,
  renderTemplate,
} from "@/entities/message";
import { getPlanById } from "@/entities/plan";
import { formatDate, formatMoneyCompact } from "@/shared/lib";

/** HTTP layer for outbound messages. */

/**
 * Outcomes a caller may report. Deliberately only these two: `sent` means the
 * browser handed the message to WhatsApp, `skipped` means a human decided not to
 * message this member. Every other status in the enum belongs to a provider
 * webhook, or is not written at all yet.
 */
const COMMITTABLE_STATUSES = ["sent", "skipped"] as const;
type CommittableStatus = (typeof COMMITTABLE_STATUSES)[number];

function isCommittableStatus(value: unknown): value is CommittableStatus {
  return COMMITTABLE_STATUSES.includes(value as CommittableStatus);
}

/** GET /admin/api/messages  — the ledger plus the available templates. */
export async function listMessagesHandler(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? limitParam : 100;

  const [messages, templates] = await Promise.all([
    getMessages({ limit }),
    getMessageTemplates(),
  ]);

  return Response.json({
    ok: true,
    count: messages.length,
    messages,
    templates,
  });
}

/**
 * POST /admin/api/messages — records the OUTCOME of a reminder.
 *
 * Body: { memberId, templateKey, status, ruleId?, period? }
 *
 * This is the commit step, not a send. The Reminders page renders the body and
 * builds the `wa.me` link during page render; the client opens that link and
 * then reports what happened here. Writing only on a reported outcome is what
 * stops the ledger claiming messages that were never handed to WhatsApp — which
 * is exactly what this handler used to do by writing "sent" up front.
 *
 * It does NOT call the WhatsApp API — see entities/message/model/whatsapp.ts.
 *
 * `period` is the membership end date the message is ABOUT, and it is what makes
 * the dedupe key repeatable across terms. It defaults to the member's `planEnd`.
 *
 * The body is rendered here rather than accepted from the client, so
 * `rendered_body` stays server-owned and a caller cannot forge what was sent.
 */
export async function sendMessageHandler(request: Request) {
  let body: {
    memberId?: string;
    templateKey?: string;
    status?: string;
    ruleId?: string | null;
    period?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.memberId) {
    return Response.json({ ok: false, errors: { memberId: "A member is required." } }, { status: 422 });
  }
  if (!body.templateKey) {
    return Response.json({ ok: false, errors: { templateKey: "A template is required." } }, { status: 422 });
  }
  if (!isCommittableStatus(body.status)) {
    return Response.json(
      {
        ok: false,
        errors: {
          status: `An outcome is required: one of ${COMMITTABLE_STATUSES.join(", ")}.`,
        },
      },
      { status: 422 }
    );
  }
  const status = body.status;

  const member = await getMemberById(body.memberId);
  if (!member) {
    return Response.json({ ok: false, error: "Member not found." }, { status: 404 });
  }

  const template = await getMessageTemplateByKey(body.templateKey);
  if (!template) {
    return Response.json(
      { ok: false, error: `No template named "${body.templateKey}".` },
      { status: 404 }
    );
  }

  const period = body.period ?? member.planEnd;

  // A skip is a decision NOT to message, so there is nothing to render and the
  // consent rule does not apply. Recording it is the point: previously a member
  // who was deliberately passed over left no trace in the ledger at all.
  let renderedBody: string | null = null;

  if (status === "sent") {
    if (!member.whatsappOptIn) {
      // Meta requires documented consent, and sending without it risks the number
      // being reported and quality-rated. Refused here rather than trusted to the
      // UI, because this is the last point before something leaves the building.
      return Response.json(
        {
          ok: false,
          errors: {
            whatsappOptIn: `${member.fullName} has not given WhatsApp consent. Record it on their profile first.`,
          },
        },
        { status: 422 }
      );
    }

    // The plan is fetched purely to fill {{plan}} and {{amount}}.
    const plan = member.planId ? await getPlanById(member.planId) : null;

    const values: Record<string, string> = {
      // First name only: "Hi Aarav" reads like a person wrote it.
      name: member.fullName.trim().split(/\s+/)[0] ?? member.fullName,
      plan: plan?.name ?? "",
      date: formatDate(member.planEnd),
      code: member.memberCode,
      amount: plan ? formatMoneyCompact(plan.priceCents) : "",
    };

    const missing = missingVariables(template.body, values);
    if (missing.length > 0) {
      return Response.json(
        {
          ok: false,
          errors: {
            templateKey: `This template needs ${missing.join(", ")}, which this member has no value for.`,
          },
        },
        { status: 422 }
      );
    }

    const rendered = renderTemplate(template.body, values);
    if (!isSendableBody(rendered)) {
      return Response.json(
        { ok: false, error: "The rendered message is empty or too long to send." },
        { status: 422 }
      );
    }

    renderedBody = rendered;
  }

  try {
    const message = await logMessage({
      memberId: member.id,
      ruleId: body.ruleId ?? null,
      templateKey: template.key,
      period,
      toPhone: member.phone,
      renderedBody,
      status,
    });

    return Response.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateMessageError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }
    throw error;
  }
}
