import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, isSendableBody, MAX_WHATSAPP_BODY } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("strips the leading + that wa.me cannot use", () => {
    // Leaving the + in produces a link that opens WhatsApp but finds no
    // contact, with no error to explain why.
    expect(buildWhatsAppLink("+919876543210", "hi")).toBe(
      "https://wa.me/919876543210?text=hi"
    );
    expect(buildWhatsAppLink("+919876543210", "hi")).not.toContain("wa.me/+91");
  });

  it("percent-encodes the message body", () => {
    const link = buildWhatsAppLink("+919876543210", "Hi Aarav, your plan expires 26 Sep.");
    expect(link).toContain("text=Hi%20Aarav%2C%20your%20plan%20expires%2026%20Sep.");
  });

  it("encodes characters that would otherwise break the URL", () => {
    const link = buildWhatsAppLink("+919876543210", "a&b=c?d#e");
    expect(link).toContain("%26");
    expect(link).toContain("%3D");
    expect(link).toContain("%3F");
    expect(link).toContain("%23");
  });

  it("tolerates a number stored with formatting", () => {
    expect(buildWhatsAppLink("+91 98765-43210", "hi")).toBe(
      "https://wa.me/919876543210?text=hi"
    );
  });
});

describe("isSendableBody", () => {
  it("accepts a normal reminder", () => {
    expect(isSendableBody("Hi Aarav, your membership expires on 26 Sep 2026.")).toBe(true);
  });

  it("rejects an empty or whitespace-only body", () => {
    expect(isSendableBody("")).toBe(false);
    expect(isSendableBody("   ")).toBe(false);
  });

  it("rejects a body over WhatsApp's limit", () => {
    expect(isSendableBody("x".repeat(MAX_WHATSAPP_BODY))).toBe(true);
    expect(isSendableBody("x".repeat(MAX_WHATSAPP_BODY + 1))).toBe(false);
  });
});
