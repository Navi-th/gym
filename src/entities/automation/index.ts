/**
 * Public API of the `automation` entity slice.
 *
 * This slice owns WHEN to message and WHO a rule applies to. The message TEXT
 * belongs to the `message` entity, and this slice refers to it only by template
 * key — it cannot import that entity, because two entity slices may not import
 * each other under FSD.
 */

// --- data access -----------------------------------------------------------
export { getEnabledRules, getRules } from "./api/get-rules";
export { updateRule } from "./api/update-rule";

// --- model -----------------------------------------------------------------
export {
  isWiredTrigger,
  selectDueForRule,
  WIRED_TRIGGERS,
  type RuleCandidate,
  type WiredTrigger,
} from "./model/select";
export {
  MAX_OFFSET_DAYS,
  validateRuleInput,
  type RuleInput,
  type RuleValidationResult,
} from "./model/validate";
export type { AutomationRule, AutomationTrigger, NewAutomationRule } from "./model/types";
