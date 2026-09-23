"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/shared/ui";
import type { MessageTemplate } from "@/entities/message";
import { submitReminder } from "../api/submit-reminder";

export function SendReminderButton({
  memberId,
  templates,
}: {
  memberId: string;
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

    const result = await submitReminder({ memberId, templateKey });

    if (!result.ok) {
      setBusy(false);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not prepare the message.");
      return;
    }

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

      <Button size="sm" onClick={send} loading={busy}>
        {busy ? "Preparing…" : "Send"}
      </Button>

      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
}
