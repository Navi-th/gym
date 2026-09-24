import { eq } from "drizzle-orm";
import { automationRules as rulesTable, getDb } from "@/shared/db";
import type { AutomationRule } from "../model/types";
import type { RuleInput } from "../model/validate";

/**
 * Updates a rule in place.
 *
 * Returns null when no such rule exists, so the caller can answer 404 rather
 * than reporting a success that changed nothing.
 */
export async function updateRule(id: string, patch: RuleInput): Promise<AutomationRule | null> {
  const db = getDb();

  const rows = await db
    .update(rulesTable)
    .set({
      name: patch.name,
      offsetDays: patch.offsetDays,
      templateKey: patch.templateKey,
      isEnabled: patch.isEnabled,
    })
    .where(eq(rulesTable.id, id))
    .returning();

  return rows[0] ?? null;
}
