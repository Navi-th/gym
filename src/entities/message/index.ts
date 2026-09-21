/**
 * Public API of the `message` entity slice.
 *
 * The outbound ledger and the template renderer. Delivery in v1 is a `wa.me`
 * deep link plus a human pressing send — see model/whatsapp.ts for why.
 */

// --- data access -----------------------------------------------------------
export { logMessage, type LogMessageInput } from "./api/log-message";
export { getMessages, getSentTemplateKeys, type MessageWithMember } from "./api/get-messages";
export {
  getMessageTemplateByKey,
  getMessageTemplates,
  type MessageTemplate,
} from "./api/get-message-templates";

// --- model -----------------------------------------------------------------
export { buildDedupeKey } from "./model/dedupe";
export { DuplicateMessageError, TemplateNotFoundError } from "./model/errors";
export {
  extractVariables,
  missingVariables,
  renderTemplate,
} from "./model/render";
export {
  buildWhatsAppLink,
  isSendableBody,
  MAX_WHATSAPP_BODY,
} from "./model/whatsapp";
export type {
  Message,
  MessageChannel,
  MessageStatus,
  NewMessage,
} from "./model/types";
