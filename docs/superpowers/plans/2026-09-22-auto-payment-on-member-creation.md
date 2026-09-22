# Automatic Payment Recording on Member Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically record a financial payment transaction when creating a member with a plan, and add a Record Payment card to the Member Details page.

**Architecture:** Update `createMemberHandler` API route to call `recordPayment` with the selected plan's price and payment method (`cash` or `upi`) when `planId` is provided. Update `MemberForm` UI to render a Payment Method select field. Render `PaymentForm` on the Member Details page for active members.

**Tech Stack:** Next.js App Router, React 19, TypeScript, TailwindCSS, Drizzle ORM.

## Global Constraints

- **Payment Methods:** `"cash"` (default), `"upi"`.
- **Payment Amount:** Automatically pulled from the selected plan (`plan.priceCents`).

---

### Task 1: Update API Handler to Automatically Record Payment

**Files:**
- Modify: `src/_app/api-routes/members.ts`

**Interfaces:**
- Consumes: `body.planId`, `body.paymentMethod` (`"cash" | "upi"`)
- Produces: Member record, active subscription, AND recorded payment entry in DB

- [ ] **Step 1: Import `recordPayment` and update `createMemberHandler`**

In `src/_app/api-routes/members.ts`:
1. Import `recordPayment` and `type PaymentMethod` from `@/entities/payment`.
2. Update body type to include `paymentMethod?: string`.
3. Inside `createMemberHandler`, after `assignPlan` succeeds, call `recordPayment`:
```ts
const method = (body.paymentMethod === "upi" ? "upi" : "cash") as PaymentMethod;
const nowISO = new Date().toISOString();
await recordPayment({
  memberId: member.id,
  subscriptionId: subscription.id,
  amountCents: plan.priceCents,
  method,
  paidAt: nowISO,
  periodStart: subscription.startDate,
  periodEnd: subscription.endDate,
  note: `Payment for ${plan.name}`,
});
```

- [ ] **Step 2: Run type check**

Run `npx tsc --noEmit` to verify 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/_app/api-routes/members.ts
git commit -m "feat(members-api): auto record payment transaction when creating member with plan"
```

---

### Task 2: Update `MemberForm` UI to Include Payment Method Select

**Files:**
- Modify: `src/features/save-member/ui/member-form.tsx`

**Interfaces:**
- Consumes: User selection of `paymentMethod` (`"cash" | "upi"`)
- Produces: Updated payload containing `paymentMethod` sent to `/admin/api/members`

- [ ] **Step 1: Add `paymentMethod` to `MemberForm` state & UI**

In `src/features/save-member/ui/member-form.tsx`:
1. Add `paymentMethod: "cash" | "upi"` to `FormValues` (default `"cash"`).
2. When `mode === "create"` and `values.planId` is selected, render a `<Field label="Payment method">` with `<Select>` options:
   - `<option value="cash">Cash</option>`
   - `<option value="upi">UPI</option>`
3. Pass `paymentMethod: mode === "create" && values.planId ? values.paymentMethod : undefined` in `submitMember(...)` payload.

- [ ] **Step 2: Run type check**

Run `npx tsc --noEmit` to verify 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/features/save-member/ui/member-form.tsx
git commit -m "feat(save-member): add payment method selector to member creation form"
```

---

### Task 3: Add Record Payment Card to Member Details Page

**Files:**
- Modify: `src/_pages/member-form/ui/member-form-page.tsx`

**Interfaces:**
- Consumes: Member and active subscription details
- Produces: Inline payment recording card for active members

- [ ] **Step 1: Import `PaymentForm` and render Record Payment Card**

In `src/_pages/member-form/ui/member-form-page.tsx`:
1. Import `PaymentForm` from `@/features/record-payment`.
2. When `member` and `subscription` exist, render a `<Card>` with `CardHeader` "Record payment" and `<PaymentForm memberId={member.id} subscriptionId={subscription.id} suggestedAmountCents={subscription.priceCentsCharged} />`.

- [ ] **Step 2: Run type check & build verification**

Run `npx tsc --noEmit` to verify 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/_pages/member-form/ui/member-form-page.tsx docs/superpowers/plans/2026-09-22-auto-payment-on-member-creation.md
git commit -m "feat(member-page): add record payment card to member details page"
```
