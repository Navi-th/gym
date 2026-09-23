# Subscriptions Simplification & Integrated Payment Flow Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate duplicate payment records by removing the standalone payment card on `/admin/members/[id]` and integrating a Payment Method selector directly into the Renew & Change Plan actions.

**Architecture:** Update `submitPlanAction` and `updateSubscriptionHandler` to pass `paymentMethod` ("cash" | "upi" | "card" | "bank"), update `MemberPlanActions` UI to include a payment method selector, and remove the standalone `PaymentForm` card from `MemberFormPage`.

**Tech Stack:** Next.js (App Router), Drizzle ORM, SQLite / Cloudflare D1, Vitest, TypeScript, Tailwind CSS.

## Global Constraints
- **FSD Architecture:** Code must follow Feature-Sliced Design rules (`npm run lint:fsd`).
- **Single Atomic Payment Record:** Each renewal or plan change creates exactly one payment row.
- **Quality Gate:** `npm run verify` must pass cleanly before completion.

---

### Task 1: Integrate Payment Method into API & Route Handlers

**Files:**
- Modify: `src/features/manage-subscription/api/submit-action.ts:1-25`
- Modify: `src/_app/api-routes/subscription-by-id.ts:8-30`

**Interfaces:**
- Consumes: `renewMemberPlan` from `src/entities/member`.
- Produces: `submitPlanAction` accepting `paymentMethod`.

- [ ] **Step 1: Update `submitPlanAction` API signature**

Update `src/features/manage-subscription/api/submit-action.ts`:

```typescript
export type PlanActionInput =
  | { action: "renew"; memberId: string; paymentMethod: "cash" | "upi" | "card" | "bank" }
  | { action: "change_plan"; memberId: string; newPlanId: string; paymentMethod: "cash" | "upi" | "card" | "bank" };
```

- [ ] **Step 2: Update `updateSubscriptionHandler` route handler**

Update `src/_app/api-routes/subscription-by-id.ts` to parse `paymentMethod` and pass it to `renewMemberPlan`:

```typescript
const paymentMethod = (body.paymentMethod === "upi" || body.paymentMethod === "card" || body.paymentMethod === "bank")
  ? body.paymentMethod
  : "cash";

await renewMemberPlan({
  memberId: member.id,
  planId: plan.id,
  durationDays: plan.durationDays,
  priceCents: plan.priceCents,
  currentEnd: member.planEnd,
  stage: member.stage,
  paymentMethod,
});
```

- [ ] **Step 3: Run Vitest unit tests**

Run: `npm test`  
Expected: PASS

- [ ] **Step 4: Commit Task 1 changes**

```bash
git add src/features/manage-subscription/api/submit-action.ts src/_app/api-routes/subscription-by-id.ts
git commit -m "feat(api): integrate paymentMethod into plan renewal and route handler"
```

---

### Task 2: Add Payment Method Selector to `MemberPlanActions` UI & Remove Standalone Payment Card

**Files:**
- Modify: `src/features/manage-subscription/ui/subscription-actions.tsx:1-80`
- Modify: `src/_pages/member-form/ui/member-form-page.tsx:120-150`

**Interfaces:**
- Consumes: `PAYMENT_METHODS` and `PAYMENT_METHOD_LABELS` from `@/entities/payment`.
- Produces: Integrated Payment Method dropdown in `MemberPlanActions` and clean `MemberFormPage`.

- [ ] **Step 1: Add Payment Method selector to `MemberPlanActions`**

Update `src/features/manage-subscription/ui/subscription-actions.tsx`:

```tsx
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
```

- [ ] **Step 2: Remove standalone `PaymentForm` card from `MemberFormPage`**

Update `src/_pages/member-form/ui/member-form-page.tsx` to remove the standalone payment card.

- [ ] **Step 3: Run full verification suite**

Run: `npm run verify`  
Expected: PASS

- [ ] **Step 4: Commit Task 2 changes**

```bash
git add src/features/manage-subscription/ui/subscription-actions.tsx src/_pages/member-form/ui/member-form-page.tsx
git commit -m "feat(ui): add payment method selector to renewal and remove standalone payment card"
```
