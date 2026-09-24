import type { automationRules } from "@/shared/db";

/**
 * Automation rule entity types.
 *
 * Derived from the Drizzle table rather than hand-written, so the types can
 * never drift from the database schema.
 */
export type AutomationRule = typeof automationRules.$inferSelect;
export type NewAutomationRule = typeof automationRules.$inferInsert;

export type AutomationTrigger = AutomationRule["trigger"];
