import {
  getRules,
  isWiredTrigger,
  updateRule,
  validateRuleInput,
} from "@/entities/automation";
import { getMessageTemplateByKey, getMessageTemplates } from "@/entities/message";

/** HTTP layer for automation rules. */

type RouteContext = { params: { id: string } };

/** GET /admin/api/automation-rules — every rule, plus the templates it may use. */
export async function listRulesHandler(_request: Request) {
  const [rules, templates] = await Promise.all([getRules(), getMessageTemplates()]);
  return Response.json({ ok: true, rules, templates });
}

/**
 * PATCH /admin/api/automation-rules/:id
 *
 * Body: { name?, offsetDays?, templateKey?, isEnabled? }
 *
 * Partial, like the plans PATCH: the rules form sends a whole row, but a caller
 * flipping one toggle should not have to restate the rest.
 */
export async function updateRuleHandler(request: Request, context: RouteContext) {
  const existing = (await getRules()).find((rule) => rule.id === context.params.id);
  if (!existing) {
    return Response.json({ ok: false, error: "Rule not found." }, { status: 404 });
  }

  let body: Partial<{
    name: string;
    offsetDays: number;
    templateKey: string;
    isEnabled: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateRuleInput({
    name: body.name ?? existing.name,
    offsetDays: body.offsetDays ?? existing.offsetDays,
    templateKey: body.templateKey ?? existing.templateKey,
    isEnabled: body.isEnabled ?? existing.isEnabled,
  });

  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 422 });
  }

  // Enabling a rule the engine cannot act on would leave something that looks
  // live and silently does nothing — worse than refusing outright.
  if (result.value.isEnabled && !isWiredTrigger(existing.trigger)) {
    return Response.json(
      {
        ok: false,
        errors: {
          isEnabled: `The "${existing.trigger}" trigger is not wired up yet, so this rule cannot be enabled.`,
        },
      },
      { status: 422 }
    );
  }

  // Checked explicitly so a bad key is a readable 422 rather than a foreign-key
  // error surfacing as a 500.
  const template = await getMessageTemplateByKey(result.value.templateKey);
  if (!template) {
    return Response.json(
      { ok: false, errors: { templateKey: `No template named "${result.value.templateKey}".` } },
      { status: 422 }
    );
  }

  const rule = await updateRule(context.params.id, result.value);
  if (!rule) {
    return Response.json({ ok: false, error: "Rule not found." }, { status: 404 });
  }

  return Response.json({ ok: true, rule });
}
