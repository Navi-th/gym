"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { MAX_OFFSET_DAYS, type AutomationRule } from "@/entities/automation";
import type { MessageTemplate } from "@/entities/message";

/**
 * One editable automation rule.
 *
 * The offset and the message are editable; the trigger is not. Changing what a
 * rule MEANS would silently change which members it selects — and a rule is a
 * stored statement of intent, not a form to fill in.
 *
 * `isEnabled` is read from the prop rather than copied into state, so the toggle
 * follows the server after `router.refresh()` — the same approach as
 * PlanRetireToggle, and the reason it cannot drift out of sync with the database.
 */
export function RuleRow({
  rule,
  templates,
  wired,
}: {
  rule: AutomationRule;
  templates: MessageTemplate[];
  wired: boolean;
}) {
  const router = useRouter();
  const [offsetDays, setOffsetDays] = useState(String(rule.offsetDays));
  const [templateKey, setTemplateKey] = useState(rule.templateKey);
  const [busy, setBusy] = useState<"toggle" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = offsetDays !== String(rule.offsetDays) || templateKey !== rule.templateKey;

  async function patch(payload: Record<string, unknown>, which: "toggle" | "save") {
    setBusy(which);
    setError(null);

    const response = await fetch(`/admin/api/automation-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; errors?: Record<string, string>; error?: string }
      | null;

    setBusy(null);

    if (!response.ok || !data?.ok) {
      const fieldError = data?.errors ? Object.values(data.errors)[0] : undefined;
      setError(fieldError ?? data?.error ?? `Failed with status ${response.status}.`);
      return;
    }

    router.refresh();
  }

  const daysLabel = rule.trigger === "plan_expiring" ? "days before expiry" : "days of arrears";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        rule.isEnabled ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-bold text-zinc-900">{rule.name}</span>
          <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            {rule.trigger}
          </span>
        </div>

        {wired ? (
          <Button
            size="sm"
            variant={rule.isEnabled ? "secondary" : "primary"}
            onClick={() => patch({ isEnabled: !rule.isEnabled }, "toggle")}
            disabled={busy !== null}
          >
            {busy === "toggle" ? "…" : rule.isEnabled ? "Switch off" : "Switch on"}
          </Button>
        ) : (
          <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
            Not wired yet
          </span>
        )}
      </div>

      {wired && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            max={MAX_OFFSET_DAYS}
            value={offsetDays}
            onChange={(e) => setOffsetDays(e.target.value)}
            className="h-9 w-20 min-h-0 px-2 py-1 text-xs"
            aria-label={`Days for ${rule.name}`}
          />
          <span className="text-[11px] font-semibold text-zinc-600">{daysLabel}</span>

          <Select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            className="h-9 w-40 min-h-0 px-2 py-1 text-xs"
            aria-label={`Message for ${rule.name}`}
          >
            {templates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.key}
              </option>
            ))}
          </Select>

          <Button
            size="sm"
            onClick={() => patch({ offsetDays: Number(offsetDays), templateKey }, "save")}
            disabled={busy !== null || !dirty}
            loading={busy === "save"}
          >
            Save
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
