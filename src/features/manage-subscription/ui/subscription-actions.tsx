"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { MemberStatus } from "@/entities/member";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PaymentMethod } from "@/entities/payment";
import { Plan } from "@/entities/plan";
import { submitPlanAction } from "../api/submit-action";

export function MemberPlanActions({
  memberId,
  currentPlanId,
  status,
  plans,
}: {
  memberId: string;
  currentPlanId?: string | null;
  status: MemberStatus;
  plans: Plan[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId ?? plans[0]?.id ?? "");
  const [showChangePlan, setShowChangePlan] = useState(false);

  // When status is active, hide renew/change buttons
  if (status === "active") {
    return (
      <div className="text-xs text-zinc-500 font-medium italic">
        Plan is active. Renewal button becomes available when expiring soon.
      </div>
    );
  }

  async function handleRenew() {
    setBusy("renew");
    setError(null);
    const res = await submitPlanAction({ action: "renew", memberId, paymentMethod });
    setBusy(null);
    if (!res.ok) {
      setError(res.message ?? "Failed to renew plan");
    } else {
      router.refresh();
    }
  }

  async function handleChangePlan() {
    setBusy("change");
    setError(null);
    const res = await submitPlanAction({
      action: "change_plan",
      memberId,
      newPlanId: selectedPlanId,
      paymentMethod,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message ?? "Failed to change plan");
    } else {
      setShowChangePlan(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        className="h-8 rounded-md border border-zinc-300 bg-white px-2 py-0 text-xs font-medium text-zinc-900"
        aria-label="Payment Method"
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {PAYMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </select>

      <Button size="sm" onClick={handleRenew} disabled={busy !== null}>
        {busy === "renew" ? "Renewing…" : "Renew Plan"}
      </Button>

      {showChangePlan ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="h-8 rounded-md border border-zinc-300 bg-white px-2 py-0 text-xs font-medium text-zinc-900"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.priceCents / 100})
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={handleChangePlan} disabled={busy !== null}>
            {busy === "change" ? "Updating…" : "Confirm Change"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowChangePlan(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setShowChangePlan(true)}>
          Change Plan
        </Button>
      )}

      {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
    </div>
  );
}

export { MemberPlanActions as SubscriptionActions };
