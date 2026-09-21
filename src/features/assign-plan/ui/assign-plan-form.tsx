"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/shared/ui";
import { billingPeriodLabel, type Plan } from "@/entities/plan";
import { formatMoneyCompact } from "@/shared/lib";
import { submitAssignPlan } from "../api/submit-assign";

/**
 * Starts a subscription for a member.
 *
 * Plans are passed in rather than fetched: the page already has them, and a
 * form that loads its own options is a form that can fail to render for
 * reasons unrelated to what the user is doing.
 */
export function AssignPlanForm({
  memberId,
  plans,
}: {
  memberId: string;
  plans: Plan[];
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans.find((p) => p.isActive)?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await submitAssignPlan({
      memberId,
      planId,
      // Omit unless chosen, so the API applies "today" rather than an empty string.
      startDate: startDate.trim() === "" ? undefined : startDate,
    });

    if (!result.ok) {
      setSaving(false);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not assign the plan.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <Field label="Plan" htmlFor="planId" className="min-w-[220px] flex-1">
        <Select id="planId" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id} disabled={!plan.isActive}>
              {plan.name} · {formatMoneyCompact(plan.priceCents)}{" "}
              {billingPeriodLabel(plan.billingPeriod).toLowerCase()}
              {plan.isActive ? "" : " (retired)"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Starts" htmlFor="startDate" hint="Blank = today" className="w-40">
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </Field>

      <Button type="submit" disabled={saving || !planId}>
        {saving ? "Starting…" : "Start plan"}
      </Button>

      {error && <span className="pb-2 text-xs font-semibold text-rose-400">{error}</span>}
    </form>
  );
}
