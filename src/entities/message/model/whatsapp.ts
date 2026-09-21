/**
 * WhatsApp delivery helpers.
 *
 * V1 deliberately does NOT call the Cloud API. It builds a `wa.me` deep link
 * that opens WhatsApp with the message prefilled, and a human presses send.
 *
 * The reasons are practical rather than technical:
 *  - Meta requires PRE-APPROVED TEMPLATES for business-initiated messages, and
 *    approval takes days. A reminder IS business-initiated, so an API-based v1
 *    would be blocked behind that queue instead of shipping.
 *  - It needs no business verification, no access token and no per-message
 *    cost.
 *  - It puts a person in the loop for the first real sends, which is exactly
 *    where you want one.
 *
 * These functions are the seam. Swapping in the Cloud API later means adding a
 * second implementation behind the same call site, not rewriting callers.
 */

/**
 * Builds a wa.me link.
 *
 * wa.me takes the number WITHOUT the leading `+`, which is why this strips all
 * non-digits rather than passing the stored E.164 straight through. Leaving the
 * `+` in produces a link that fails silently — WhatsApp opens but finds no
 * contact.
 */
export function buildWhatsAppLink(phoneE164: string, text: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * WhatsApp rejects a message body over 4096 characters.
 *
 * Checked before sending rather than discovered on delivery, and deliberately
 * generous: a reminder is a couple of lines, so hitting this means a template
 * has gone wrong.
 */
export const MAX_WHATSAPP_BODY = 4096;

export function isSendableBody(text: string): boolean {
  return text.trim().length > 0 && text.length <= MAX_WHATSAPP_BODY;
}
