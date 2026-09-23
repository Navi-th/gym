# Subscriptions Simplification & Direct Member Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the database schema by removing the `subscriptions` table, updating `members` to store plan dates directly, simplifying `payments` (removing `subscription_id`, `reference`, `note`), and updating the member management UI (`/admin/members/[id]`) to hide the renewal button until a plan is expiring soon or expired.

**Architecture:** We will update Drizzle schema definitions in `src/shared/db/schema.ts`, migrate member plan assignment and renewal logic directly into `src/entities/member`, simplify payment logging in `src/entities/payment`, update deduplication in `src/entities/message`, update UI components in `src/_pages/member-form`, and delete obsolete subscription files.

**Tech Stack:** Next.js (App Router), Drizzle ORM, SQLite / Cloudflare D1, Vitest, TypeScript, Tailwind CSS.

## Global Constraints
- **Database Rules:** No float money fields — all prices in integer minor units (`price_cents`). All dates ISO-8601 text (`YYYY-MM-DD`).
- **FSD Architecture:** Code must follow Feature-Sliced Design rules. Validate with `npm run lint:fsd`.
- **Status Derivation:** Member status (`active`, `expiring_soon`, `expired`, `frozen`) must be derived dynamically from `planEnd` and `stage`.
- **Quality Gate:** `npm run verify` must pass cleanly before completion.

---

### Task 1: Update Database Schema & Generate Migration

**Files:**
- Modify: `src/shared/db/schema.ts:80-140`
- Test: `src/entities/member/model/status.test.ts`

**Interfaces:**
- Consumes: Drizzle SQLite table definitions.
- Produces: Updated `members`, `payments`, and `messages` tables without `subscriptions` or `reference`/`note` columns.

- [ ] **Step 1: Update Drizzle Schema**

Remove `subscriptions` table definition. Update `payments` table and `messages` table in `src/shared/db/schema.ts`:

```typescript
// src/shared/db/schema.ts

// Payments
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    amountCents: integer("amount_cents").notNull(),
    method: text("method", { enum: ["cash", "upi", "card", "bank"] }).notNull(),
    paidAt: text("paid_at").notNull(),
    periodStart: text("period_start"),
    periodEnd: text("period_end"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_payments_member").on(t.memberId)]
);

// Messages
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    ruleId: text("rule_id").references(() => automationRules.id),
    templateKey: text("template_key").notNull(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    toPhone: text("to_phone").notNull(),
    channel: text("channel").notNull().default("whatsapp"),
    status: text("status", {
      enum: ["queued", "sent", "delivered", "read", "failed", "skipped"],
    })
      .notNull()
      .default("queued"),
    providerMessageId: text("provider_message_id"),
    renderedBody: text("rendered_body"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    sentAt: text("sent_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_messages_member").on(t.memberId)]
);
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `npm run db:generate`  
Expected: Migration SQL generated inside `drizzle/`.

- [ ] **Step 3: Run existing unit tests**

Run: `npm test`  
Expected: Unit tests run.

- [ ] **Step 4: Commit schema changes**

```bash
git add src/shared/db/schema.ts drizzle/
git commit -m "schema: remove subscriptions table and simplify payments schema"
```

---

### Task 2: Implement Plan Assignment & Renewal in Member Entity

**Files:**
- Create: `src/entities/member/api/assign-plan.ts`
- Create: `src/entities/member/api/renew-plan.ts`
- Create: `src/entities/member/api/assign-plan.test.ts`
- Modify: `src/entities/member/index.ts`

**Interfaces:**
- Consumes: `members` and `payments` tables from `src/shared/db`.
- Produces: `assignPlanToMember()` and `renewMemberPlan()` functions in `src/entities/member`.

- [ ] **Step 1: Write failing test for member plan assignment and renewal**

Create `src/entities/member/api/assign-plan.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { computeRenewalDates } from "../model/status";

describe("computeRenewalDates", () => {
  it("extends from planEnd when renewing early during expiring_soon", () => {
    const result = computeRenewalDates({
      currentEnd: "2026-10-30",
      status: "expiring_soon",
      durationDays: 30,
      today: "2026-10-25",
    });
    expect(result.startDate).toBe("2026-10-30");
    expect(result.endDate).toBe("2026-11-29");
  });

  it("starts from today when renewing an expired plan", () => {
    const result = computeRenewalDates({
      currentEnd: "2026-10-20",
      status: "expired",
      durationDays: 30,
      today: "2026-10-25",
    });
    expect(result.startDate).toBe("2026-10-25");
    expect(result.endDate).toBe("2026-11-24");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test src/entities/member/api/assign-plan.test.ts`  
Expected: FAIL with "computeRenewalDates not defined"

- [ ] **Step 3: Implement date calculation and member plan functions**

Add `computeRenewalDates` in `src/entities/member/model/status.ts`:

```typescript
import { addDays, toDateOnly } from "@/shared/lib";

export function computeRenewalDates(input: {
  currentEnd?: string | null;
  status: MemberStatus;
  durationDays: number;
  today: string;
}): { startDate: string; endDate: string } {
  const startDate =
    input.status === "expiring_soon" && input.currentEnd && input.currentEnd >= input.today
      ? input.currentEnd
      : input.today;

  // Duration days minus 1 gives inclusive end date
  const end = new Date(startDate);
  end.setUTCDate(end.getUTCDate() + input.durationDays - 1);
  const endDate = end.toISOString().slice(0, 10);

  return { startDate, endDate };
}
```

Create `src/entities/member/api/assign-plan.ts`:

```typescript
import { eq } from "drizzle-orm";
import { getDb, members, payments } from "@/shared/db";
import { newId, todayUtc } from "@/shared/lib";

export async function assignPlanToMember(input: {
  memberId: string;
  planId: string;
  durationDays: number;
  priceCents: number;
  paymentMethod?: "cash" | "upi" | "card" | "bank";
}): Promise<void> {
  const db = getDb();
  const today = todayUtc();
  
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + input.durationDays - 1);
  const endDate = end.toISOString().slice(0, 10);

  const now = new Date().toISOString();
  const paymentId = newId();

  await db.batch([
    db
      .update(members)
      .set({
        planId: input.planId,
        planStart: today,
        planEnd: endDate,
        stage: "active",
        updatedAt: now,
      })
      .where(eq(members.id, input.memberId)),

    db.insert(payments).values({
      id: paymentId,
      memberId: input.memberId,
      amountCents: input.priceCents,
      method: input.paymentMethod ?? "cash",
      paidAt: today,
      periodStart: today,
      periodEnd: endDate,
      createdAt: now,
    }),
  ]);
}
```

Create `src/entities/member/api/renew-plan.ts`:

```typescript
import { eq } from "drizzle-orm";
import { getDb, members, payments } from "@/shared/db";
import { newId, todayUtc } from "@/shared/lib";
import { computeRenewalDates, deriveMemberStatus } from "../model/status";

export async function renewMemberPlan(input: {
  memberId: string;
  planId: string;
  durationDays: number;
  priceCents: number;
  currentEnd?: string | null;
  stage: "active" | "frozen";
  paymentMethod?: "cash" | "upi" | "card" | "bank";
}): Promise<void> {
  const db = getDb();
  const today = todayUtc();
  const status = deriveMemberStatus({ stage: input.stage, planEnd: input.currentEnd });

  const { startDate, endDate } = computeRenewalDates({
    currentEnd: input.currentEnd,
    status,
    durationDays: input.durationDays,
    today,
  });

  const now = new Date().toISOString();
  const paymentId = newId();

  await db.batch([
    db
      .update(members)
      .set({
        planId: input.planId,
        planStart: startDate,
        planEnd: endDate,
        stage: "active",
        updatedAt: now,
      })
      .where(eq(members.id, input.memberId)),

    db.insert(payments).values({
      id: paymentId,
      memberId: input.memberId,
      amountCents: input.priceCents,
      method: input.paymentMethod ?? "cash",
      paidAt: today,
      periodStart: startDate,
      periodEnd: endDate,
      createdAt: now,
    }),
  ]);
}
```

Re-export from `src/entities/member/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/entities/member/api/assign-plan.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit member plan assignment & renewal logic**

```bash
git add src/entities/member/
git commit -m "feat(member): add assignPlanToMember and renewMemberPlan APIs"
```

---

### Task 3: Remove Subscriptions Entity & Obsolete Calls

**Files:**
- Delete: `src/entities/subscription/` directory
- Modify: `src/_app/api-routes/index.ts`
- Modify: `src/_pages/payments/ui/payments-page.tsx`
- Modify: `src/features/record-payment/api/submit-payment.ts`

**Interfaces:**
- Consumes: Cleaned `members` and `payments` tables.
- Produces: Payment logging without subscription dependencies.

- [ ] **Step 1: Delete subscription entity directory**

Remove `src/entities/subscription/`.

- [ ] **Step 2: Update record payment feature**

Update `src/features/record-payment/api/submit-payment.ts` to accept `memberId` without requiring `subscriptionId`, `reference`, or `note`:

```typescript
import { getDb, payments } from "@/shared/db";
import { newId, todayUtc } from "@/shared/lib";

export async function submitPayment(input: {
  memberId: string;
  amountCents: number;
  method: "cash" | "upi" | "card" | "bank";
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const today = todayUtc();

  await db.insert(payments).values({
    id: newId(),
    memberId: input.memberId,
    amountCents: input.amountCents,
    method: input.method,
    paidAt: today,
    createdAt: now,
  });

  return { ok: true };
}
```

- [ ] **Step 3: Update payments page**

Update `src/_pages/payments/ui/payments-page.tsx` table to render payment history without subscriptionId, reference, or note columns.

- [ ] **Step 4: Run tests**

Run: `npm test`  
Expected: PASS

- [ ] **Step 5: Commit cleanup**

```bash
git add -A
git commit -m "refactor: remove subscriptions entity and update payments feature"
```

---

### Task 4: Update Member UI & Renewal Button Visibility (`/admin/members/[id]`)

**Files:**
- Modify: `src/_pages/member-form/ui/member-form-page.tsx`
- Modify: `src/features/manage-subscription/ui/subscription-actions.tsx` (rename/repurpose or update)
- Modify: `src/features/manage-subscription/api/submit-action.ts`

**Interfaces:**
- Consumes: `MemberStatus`, `plans`, and `members`.
- Produces: Updated `/admin/members/[id]` UI hiding Renew button for active members and providing Renew/Change plan actions when expiring soon or expired.

- [ ] **Step 1: Update Manage Plan Actions Component**

Update `src/features/manage-subscription/ui/subscription-actions.tsx` to handle Renew and Change Plan actions based on member status:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { MemberStatus } from "@/entities/member";
import { Plan } from "@/entities/plan";
import { submitPlanAction } from "../api/submit-action";

export function MemberPlanActions({
  memberId,
  currentPlanId,
  currentEnd,
  status,
  plans,
}: {
  memberId: string;
  currentPlanId?: string | null;
  currentEnd?: string | null;
  status: MemberStatus;
  plans: Plan[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    const res = await submitPlanAction({ action: "renew", memberId });
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
    const res = await submitPlanAction({ action: "change_plan", memberId, newPlanId: selectedPlanId });
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
      <Button size="sm" onClick={handleRenew} disabled={busy !== null}>
        {busy === "renew" ? "Renewing…" : "Renew Plan"}
      </Button>

      {showChangePlan ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="h-8 rounded-md border border-zinc-300 bg-white px-2 py-0 text-xs font-medium"
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

- [ ] **Step 2: Update Member Details Page (`/admin/members/[id]`)**

Update `src/_pages/member-form/ui/member-form-page.tsx` to read plan details directly off `member` and pass `status` to `MemberPlanActions`:

```tsx
// In MemberFormPage:
const currentPlan = plans.find((p) => p.id === member.planId);

{member && (
  <Card>
    <CardHeader>
      <CardTitle>Plan & Membership</CardTitle>
      <CardDescription>
        {member.planEnd
          ? `Covered until ${formatDate(member.planEnd)}.`
          : "No active plan attached."}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {member.planId && currentPlan ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span className="text-zinc-500 font-medium">
              Current Plan{" "}
              <span className="ml-1.5 font-bold text-zinc-900">{currentPlan.name}</span>
            </span>
            <span className="text-zinc-500 font-medium">
              Period{" "}
              <span className="ml-1.5 font-bold text-zinc-900">
                {formatDate(member.planStart)} → {formatDate(member.planEnd)}
              </span>
            </span>
            <MemberStatusBadge status={member.status} />
          </div>
          <MemberPlanActions
            memberId={member.id}
            currentPlanId={member.planId}
            currentEnd={member.planEnd}
            status={member.status}
            plans={plans}
          />
        </div>
      ) : (
        <AssignPlanForm memberId={member.id} plans={plans} />
      )}
    </CardContent>
  </Card>
)}
```

- [ ] **Step 3: Run full verification**

Run: `npm run verify`  
Expected: Clean pass across FSD linting, TypeScript compilation, Vitest suite, and Next.js build.

- [ ] **Step 4: Commit UI changes**

```bash
git add src/
git commit -m "feat(ui): update member page to hide renew button when active and enable plan change"
```
