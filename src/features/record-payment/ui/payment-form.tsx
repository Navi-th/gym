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

export function PaymentForm({
  memberId,
  suggestedAmountCents,
}: {
  memberId: string;
  suggestedAmountCents: number;
}) {
  const router = useRouter();

  const [amount, setAmount] = useState(centsToPriceInput(suggestedAmountCents));
  const [method, setMethod] = useState<PaymentMethod>("cash");
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
      amountCents,
      method,
    });

    if (!result.ok) {
      setSaving(false);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not record the payment.");
      return;
    }

    setSaving(false);
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

      <Button type="submit" size="sm" loading={saving}>
        {saving ? "Saving…" : "Record"}
      </Button>

      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </form>
  );
}
