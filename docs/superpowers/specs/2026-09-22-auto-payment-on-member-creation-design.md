# Automatic Payment Recording on Member Creation & Management Design

## Overview
Automatically record a financial payment transaction whenever a new member is created with an assigned membership plan, and add a quick payment recording section to the Member Details page for active members.

## Requirements & Scope
1. **Add Member Form (`src/features/save-member/ui/member-form.tsx`)**:
   - When a membership plan is selected during member creation, display a **Payment method** select field with options: **Cash** (default) and **UPI**.
   - Pass `paymentMethod` (`"cash" | "upi"`) in the create member API payload.
2. **API Handler (`src/_app/api-routes/members.ts`)**:
   - When creating a member with `planId`, assign the plan subscription AND call `recordPayment` using the plan's exact price (`priceCents`), setting `paidAt` to `now` and `method` to the chosen payment method (`cash` or `upi`).
3. **Member Details Page (`src/_pages/member-form/ui/member-form-page.tsx`)**:
   - Add a **Record Payment** card on the member details page for active members, allowing quick payment logging at any time.

## Data Layer & API Details

### `src/_app/api-routes/members.ts`
When `body.planId` is present on POST `/admin/api/members`:
1. Create member via `createMember`.
2. Assign plan subscription via `assignPlan`.
3. Record payment via `recordPayment`:
   ```ts
   await recordPayment({
     memberId: member.id,
     subscriptionId: subscription.id,
     amountCents: plan.priceCents,
     method: (body.paymentMethod as PaymentMethod) ?? "cash",
     paidAt: new Date().toISOString(),
     periodStart: subscription.startDate,
     periodEnd: subscription.endDate,
   });
   ```

## UI Components

### `MemberForm` (`src/features/save-member/ui/member-form.tsx`)
- Form state includes `paymentMethod: "cash" | "upi"`.
- Renders `<Select>` for Payment Method when `mode === "create"` and `values.planId` is selected.

### `MemberFormPage` (`src/_pages/member-form/ui/member-form-page.tsx`)
- Render `PaymentForm` from `@/features/record-payment` inside a dedicated Card when viewing an existing member with an active subscription.

## Verification Plan
- **TypeScript Verification**: Run `npx tsc --noEmit` to verify type safety.
- **Functionality Verification**:
  - Create a new member with a plan and payment method `Cash` or `UPI`.
  - Check **Payments** page (`/admin/payments`) and verify **Collected This Month** and **Payments Recorded** count increase instantly.
  - Verify member appears in payment history table with correct amount and method.
