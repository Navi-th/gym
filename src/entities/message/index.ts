/**
 * Public API of the `message` entity slice.
 *
 * Outbound-message ledger. Sending itself arrives with modules 8-9
 * (WhatsApp); the dedupe key below is already load-bearing.
 */
export { buildDedupeKey } from "./model/dedupe";
export type {
  Message,
  MessageChannel,
  MessageStatus,
  NewMessage,
} from "./model/types";
