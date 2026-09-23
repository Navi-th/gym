# Design Specification: Subscriptions Simplification & Direct Member Plans

**Date:** 2026-09-23  
**Status:** Approved by User  
**Goal:** Simplify the database and member management by removing the `subscriptions` table, storing active plan details directly on the `members` table, tracking purchase history via `payments`, integrating payment method selection directly into the renewal action, and hiding the renewal action in `/admin/members` until a member's plan is expiring soon or expired.

---

## 1. Context & Motivation

Currently, the application maintains two parallel tables for tracking plans:
1. `members` — stores `plan_id`, `plan_start`, and `plan_end`.
2. `subscriptions` — duplicates plan assignments and renewal periods over time.

Additionally, `payments` records cash/UPI transactions for memberships. The `subscriptions` table introduces unnecessary schema complexity and query joins. Removing `subscriptions` simplifies the architecture while retaining full payment history in `payments`.

To prevent duplicate payment entries on member pages, standalone payment forms are removed from the member details view, and payment method selection (Cash/UPI/Card/Bank) is integrated directly into the Renew & Change Plan actions.

---

## 2. Schema Changes

### `src/shared/db/schema.ts`

1. **Delete `subscriptions` table**:
   Remove `export const subscriptions = sqliteTable(...)`.

2. **Update `members` table**:
   - `planId`: `text("plan_id").references(() => plans.id)` (nullable)
   - `planStart`: `text("plan_start")` (ISO date `YYYY-MM-DD`, nullable)
   - `planEnd`: `text("plan_end")` (ISO date `YYYY-MM-DD`, nullable)
   - `stage`: `text("stage", { enum: ["active", "frozen"] }).notNull().default("active")`

3. **Update `payments` table**:
   - `id`: `text("id").primaryKey()`
   - `memberId`: `text("member_id").notNull().references(() => members.id)`
   - `amountCents`: `integer("amount_cents").notNull()`
   - `method`: `text("method", { enum: ["cash", "upi", "card", "bank"] }).notNull()`
   - `paidAt`: `text("paid_at").notNull()`
   - `periodStart`: `text("period_start")`
   - `periodEnd`: `text("period_end")`
   - *Removed columns*: `subscriptionId`, `reference`, `note`.

4. **Update `messages` table**:
   - Remove `subscriptionId` foreign key and column.
   - Deduplication key updated to: `"<memberId>:<ruleId|->:<templateKey>"`.

---

## 3. Business Logic & Lifecycle Rules

### Status Derivation (`deriveMemberStatus`)
- **`frozen`**: Manual state set by admin.
- **`expired`**: `planEnd` < `today`.
- **`expiring_soon`**: `planEnd` is within 7 days of `today` (`today <= planEnd <= today + 7 days`).
- **`active`**: `planEnd` > `today + 7 days`.

### Renewal & Plan Switching (Single Atomic Action)
1. **Renew Same Plan**:
   - Admin selects Payment Method (`Cash`, `UPI`, `Card`, `Bank`).
   - If `status === 'expiring_soon'`: `newStart = current planEnd`, `newEnd = current planEnd + plan.durationDays` (preserves remaining days).
   - If `status === 'expired'`: `newStart = today`, `newEnd = today + plan.durationDays`.
2. **Change Plan**:
   - Admin selects a new plan from a dropdown and selects Payment Method.
   - `members.planId` is updated to the new plan ID.
   - `planStart` and `planEnd` are recalculated based on the new plan's duration.
3. **Automatic Single Payment Record**:
   - Every plan renewal or plan change logs **exactly one** row in `payments` with `memberId`, `amountCents`, `method`, `paidAt`, `periodStart`, and `periodEnd`.

---

## 4. UI Design (`/admin/members/[id]`)

### Member Plan Section
- **Card Display**:
  - Displays Current Plan Name, Active Period (`planStart` → `planEnd`), and Member Status Badge.
- **Renewal Button & Plan Switcher Visibility**:
  - **Hidden when status is `active`** (more than 7 days remaining). Displays a muted info label: *"Plan active. Renew button becomes available when expiring soon."*
  - **Visible when status is `expiring_soon` or `expired`**:
    - Payment Method dropdown (`Cash`, `UPI`, `Card`, `Bank`).
    - **[ Renew Plan ]** button: Extends current plan duration and logs payment method.
    - **[ Change Plan ]** dropdown + button: Assigns a different plan and logs payment method.
- **Removed Standalone Payment Card**:
  - Standalone "Record Payment" form removed from `/admin/members/[id]` to eliminate duplicate payment logs.

---

## 5. Migration & Cleanup Plan

1. Drop `subscriptions` entity from `src/entities/subscription/`.
2. Update `renewMemberPlan` in `src/entities/member/` to accept `paymentMethod`.
3. Update `MemberPlanActions` in `src/features/manage-subscription/` to include payment method selector.
4. Remove standalone `PaymentForm` from `MemberFormPage`.
5. Clear `.next` build cache (`npm run dev:clean`).
