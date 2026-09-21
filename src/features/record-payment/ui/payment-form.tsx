"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/shared/ui";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/entities/payment";
import { centsToPriceInput, parsePriceToCents } from "@/entities/plan";
import { submitPayment } from "../api/submit-payment";

/**
 * Records a payment, optionally renewing cover at the same time.
 *
 * The amount is prefilled from the plan the member is actually on, because
 * that is what they owe nine times out of ten — and it removes the chance of
 * typing a price that stopped being correct months ago.
 *
 * The price is kept as a string until submit; see parsePriceToCents for why.
 */
export function PaymentForm({
  memberId,
  subscriptionId,
  suggestedAmountCents,
  suggestedDurationDays,
}: {
  memberId: string;
  subscriptionId: string | null;
  suggestedAmountCents: number;
  suggestedDurationDays?: number;
}) {
  const router = useRouter();

  const [amount, setAmount] = useState(centsToPriceInput(suggestedAmountCents));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [renew, setRenew] = useState(Boolean(subscriptionId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const amountCents = parsePriceToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setError("Enter an amount such as 69 or 69.99.");
      return;
    }

    setSaving(true);
    const result = await submitPayment({
      memberId,
      subscriptionId,
      amountCents,
      method,
      reference: reference.trim() === "" ? null : reference,
      renew: renew && Boolean(subscriptionId),
    });

    if (!result.ok) {
      setSaving(false);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not record the payment.");
      return;
    }

    setSaving(false);
    setReference("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-24 px-2 py-0 text-xs"
        aria-label="Amount"
      />

      <Select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        className="h-8 w-28 px-2 py-0 text-xs"
        aria-label="Payment method"
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {PAYMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </Select>

      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className="h-8 w-32 px-2 py-0 text-xs"
        placeholder="Ref (optional)"
        aria-label="Payment reference"
      />

      {subscriptionId && (
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
          <input
            type="checkbox"
            checked={renew}
            onChange={(e) => setRenew(e.target.checked)}
            className="h-3.5 w-3.5 accent-black rounded"
          />
          {suggestedDurationDays ? `Renew ${suggestedDurationDays} days` : "Renew"}
        </label>
      )}

      <Button type="submit" size="sm" loading={saving}>
        {saving ? "Saving…" : "Record"}
      </Button>

      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </form>
  );
}
