"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/shared/ui";
import { centsToPriceInput, parsePriceToCents, type Plan } from "@/entities/plan";
import { submitPlan } from "../api/submit-plan";

/**
 * Create/edit form for a plan.
 *
 * One form for both modes, for the same reason as `save-member`: every field is
 * shared, and two features may not import each other, so splitting would mean
 * duplicating all of it.
 *
 * The price is handled as a STRING until submit. Passing it through a number
 * input and multiplying by 100 is how prices silently lose a paisa, so the
 * conversion happens once, in parsePriceToCents.
 */
export function PlanForm({
  mode,
  plan,
  activeSubscriptions = 0,
}: {
  mode: "create" | "edit";
  plan?: Plan;
  activeSubscriptions?: number;
}) {
  const router = useRouter();

  const [name, setName] = useState(plan?.name ?? "");
  const [price, setPrice] = useState(plan ? centsToPriceInput(plan.priceCents) : "");
  const [billingPeriod, setBillingPeriod] = useState<Plan["billingPeriod"]>(
    plan?.billingPeriod ?? "monthly"
  );
  const [durationDays, setDurationDays] = useState(String(plan?.durationDays ?? 30));
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const priceCents = parsePriceToCents(price);
    if (priceCents === null) {
      setErrors({ priceCents: "Enter a price such as 69 or 69.99." });
      return;
    }

    const duration = Number(durationDays);
    if (!Number.isInteger(duration)) {
      setErrors({ durationDays: "Duration must be a whole number of days." });
      return;
    }

    setSaving(true);
    const result = await submitPlan(mode, plan?.id, {
      name,
      priceCents,
      billingPeriod,
      durationDays: duration,
      isActive,
    });

    if (!result.ok) {
      setSaving(false);
      setErrors(result.errors ?? {});
      setFormError(result.message ?? "Please fix the highlighted fields.");
      return;
    }

    router.push("/admin/plans");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          {formError}
        </div>
      )}

      {mode === "edit" && activeSubscriptions > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-900 leading-relaxed">
          <span className="font-bold">
            {activeSubscriptions}{" "}
            {activeSubscriptions === 1 ? "subscription references" : "subscriptions reference"}
            {" "}this plan.
          </span>{" "}
          Changing the price or duration affects future assignments only — subscriptions keep
          the dates and price they were sold at, so nothing here rewrites what has already
          been agreed.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plan name" htmlFor="name" error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pro Athlete Pass"
          />
        </Field>

        <Field
          label="Price"
          htmlFor="price"
          error={errors.priceCents}
          hint={price ? `Charged per period — stored as ${parsePriceToCents(price) ?? "?"} minor units` : "Amount charged per billing period"}
        >
          <Input
            id="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="69.00"
          />
        </Field>

        <Field label="Billing period" htmlFor="billingPeriod">
          <Select
            id="billingPeriod"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value as Plan["billingPeriod"])}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </Select>
        </Field>

        <Field
          label="Duration (days)"
          htmlFor="durationDays"
          error={errors.durationDays}
          hint="Days of cover a new subscription buys"
        >
          <Input
            id="durationDays"
            inputMode="numeric"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="30"
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-black rounded cursor-pointer"
        />
        <span className="text-xs leading-relaxed text-zinc-600">
          <span className="font-bold text-zinc-900">Available to sell.</span> Unchecking retires
          the plan: it disappears from new assignments but every existing subscription stays
          exactly as it is. Retiring is the closest thing to deleting a plan here — a real
          delete would orphan member history.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={saving} showPlus={mode === "create"}>
          {saving ? "Saving…" : mode === "create" ? "Create plan" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/plans")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
