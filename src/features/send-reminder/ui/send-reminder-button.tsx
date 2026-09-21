"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/shared/ui";
import type { MessageTemplate } from "@/entities/message";
import { submitReminder } from "../api/submit-reminder";

/**
 * Sends a templated reminder over WhatsApp.
 *
 * V1 opens a `wa.me` link for a human to press send rather than calling the
 * WhatsApp API. That means one person sees every message before it goes, which
 * is the right place to be while the wording is still being tuned — and it
 * sidesteps Meta's template-approval queue entirely, which would otherwise
 * block this feature behind a multi-day review.
 *
 * The message is recorded in the ledger BEFORE the link is opened. If the
 * member closes the tab, the record still exists, and the dedupe key stops the
 * same reminder being queued twice for the same period.
 */
export function SendReminderButton({
  memberId,
  subscriptionId,
  templates,
}: {
  memberId: string;
  subscriptionId: string | null;
  templates: MessageTemplate[];
}) {
  const router = useRouter();
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!templateKey) return;
    setBusy(true);
    setError(null);

    const result = await submitReminder({ memberId, templateKey, subscriptionId });

    if (!result.ok) {
      setBusy(false);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not prepare the message.");
      return;
    }

    // Opened after a successful log, so an unsent message is never recorded as
    // sent and a sent one is never lost.
    window.open(result.link, "_blank", "noopener,noreferrer");
    setBusy(false);
    router.refresh();
  }

  if (templates.length === 0) {
    return <span className="text-[11px] text-zinc-500">No templates</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={templateKey}
        onChange={(e) => setTemplateKey(e.target.value)}
        className="h-8 w-36 px-2 py-0 text-xs"
        aria-label="Message template"
      >
        {templates.map((template) => (
          <option key={template.key} value={template.key}>
            {template.key}
          </option>
        ))}
      </Select>

      <Button size="sm" onClick={send} disabled={busy}>
        {busy ? "Preparing…" : "Send"}
      </Button>

      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
}
