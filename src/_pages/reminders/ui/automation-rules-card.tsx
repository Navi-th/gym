import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { isWiredTrigger, type AutomationRule } from "@/entities/automation";
import type { MessageTemplate } from "@/entities/message";
import { RuleRow } from "@/features/edit-rule";

/**
 * The automation rules, editable in place.
 *
 * Every rule is listed, including the two the engine cannot action yet. Hiding
 * them would leave an admin wondering where their rule went; labelling them
 * "not wired yet" is simply a fact about the system.
 */
export function AutomationRulesCard({
  rules,
  templates,
}: {
  rules: AutomationRule[];
  templates: MessageTemplate[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation rules</CardTitle>
        <CardDescription>
          When each reminder falls due and which message it uses. Changes apply immediately — no
          redeploy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-xs text-zinc-500">No rules defined.</p>
        ) : (
          rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              templates={templates}
              wired={isWiredTrigger(rule.trigger)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
