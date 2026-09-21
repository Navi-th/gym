import { getMemberById } from "@/entities/member";
import {
  buildWhatsAppLink,
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
 * POST /admin/api/messages
 *
 * Body: { memberId, templateKey, subscriptionId? }
 *
 * Renders the template against the member's real data, records it in the
 * ledger, and returns a `wa.me` link for a human to open. It does NOT call the
 * WhatsApp API — see entities/message/model/whatsapp.ts for why v1 works this
 * way.
 *
 * Rendering happens on the SERVER so that the exact text recorded in
 * `rendered_body` is the exact text the link will send. Rendering in the
 * browser would make those two things able to drift.
 */
export async function sendMessageHandler(request: Request) {
  let body: { memberId?: string; templateKey?: string; subscriptionId?: string };
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

  try {
    const message = await logMessage({
      memberId: member.id,
      subscriptionId: body.subscriptionId ?? null,
      templateKey: template.key,
      toPhone: member.phone,
      renderedBody: rendered,
      status: "sent",
    });

    return Response.json(
      { ok: true, message, rendered, link: buildWhatsAppLink(member.phone, rendered) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DuplicateMessageError) {
      return Response.json({ ok: false, error: error.message }, { status: 409 });
    }
    throw error;
  }
}
