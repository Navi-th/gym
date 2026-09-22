# Consolidate Subscriptions into Members Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate subscriptions management into the `/admin/members` directory by adding **Plan** names and **Ends** (expiration dates with relative days) to the members table, and redirecting `/admin/subscriptions` to `/admin/members`.

**Architecture:** Update `getMembers` in `src/entities/member` with a left join to `plans` table to retrieve plan names. Update `MembersTable` widget UI to render Plan and Ends columns. Remove Subscriptions from sidebar navigation and redirect the `/admin/subscriptions` route.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, Tailwind CSS, Lucide Icons.

## Global Constraints

- Preserve all existing filter parameter contracts (`q`, `status`, `page`).
- Ensure no breaking changes to `getMembers` or `MemberWithStatus` usage elsewhere.

---

### Task 1: Update Member Entity API & Types

**Files:**
- Modify: `src/entities/member/api/get-members.ts`

**Interfaces:**
- Consumes: `membersTable` and `plansTable` from `@/shared/db`, `eq` from `drizzle-orm`
- Produces: `MemberWithStatus` type with `planName: string | null` field, populated by `getMembersCached`

- [ ] **Step 1: Update `MemberWithStatus` type definition**

In `src/entities/member/api/get-members.ts`, update `MemberWithStatus`:
```ts
export type MemberWithStatus = Member & {
  status: MemberStatus;
  /** null when the member has no plan end date (e.g. a lead). */
  daysLeft: number | null;
  /** Name of the active/assigned plan, or null if unassigned. */
  planName: string | null;
};
```

- [ ] **Step 2: Update `getMembersCached` to join `plansTable`**

In `src/entities/member/api/get-members.ts`:
Import `plans as plansTable` from `@/shared/db` and `eq` from `drizzle-orm`.
Update `getMembersCached` database query:
```ts
    const rows = await db
      .select({
        member: membersTable,
        planName: plansTable.name,
      })
      .from(membersTable)
      .leftJoin(plansTable, eq(membersTable.planId, plansTable.id))
      .where(and(...conditions))
      .orderBy(desc(membersTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data: MemberWithStatus[] = rows.map(({ member: m, planName }) => ({
      ...m,
      status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd, today }),
      daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd, today) : null,
      planName: planName ?? null,
    }));
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with no errors in `get-members.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/entities/member/api/get-members.ts
git commit -m "feat(member): add planName to MemberWithStatus and join plans table in getMembers"
```

---

### Task 2: Enhance Members Table UI with Plan and Ends Columns

**Files:**
- Modify: `src/widgets/members-table/ui/members-table.tsx`

**Interfaces:**
- Consumes: `member.planName`, `member.planEnd`, `member.daysLeft` from `MemberWithStatus`, `formatDate` and `formatRelativeDays` from `@/shared/lib`

- [ ] **Step 1: Import `formatRelativeDays` in `members-table.tsx`**

Update imports in `src/widgets/members-table/ui/members-table.tsx`:
```ts
import { formatDate, formatRelativeDays, initials } from "@/shared/lib";
```

- [ ] **Step 2: Update table headers and row layout**

Update `<THead>` and `<TR>` inside `MembersTable`:
```tsx
      <THead>
        <TR>
          <TH>Member</TH>
          <TH>Phone</TH>
          <TH>Plan</TH>
          <TH>Ends</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
```
Update `TableMessage` `colSpan` to `6`:
```tsx
        {members.length === 0 ? (
          <TableMessage colSpan={6}>
            No members match. Try clearing the search, or add a member.
          </TableMessage>
```
Update `<TBody>` row cells:
```tsx
              <TD className="whitespace-nowrap text-zinc-700 font-medium">
                {member.planName ?? "—"}
              </TD>
              <TD className="whitespace-nowrap">
                <div className="text-zinc-800 font-medium">
                  {formatDate(member.planEnd)}
                </div>
                {member.planEnd && (
                  <div className="text-[11px] font-semibold text-zinc-500">
                    {formatRelativeDays(member.daysLeft)}
                  </div>
                )}
              </TD>
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/widgets/members-table/ui/members-table.tsx
git commit -m "feat(members-table): add Plan and Ends columns with relative days subtitle"
```

---

### Task 3: Remove Subscriptions Navigation & Redirect Route

**Files:**
- Modify: `src/widgets/admin-shell/ui/sidebar.tsx`
- Modify: `app/admin/subscriptions/page.tsx`

**Interfaces:**
- Consumes: Next.js `redirect` from `next/navigation`

- [ ] **Step 1: Remove Subscriptions from Sidebar `NAV`**

In `src/widgets/admin-shell/ui/sidebar.tsx`:
Remove `{ href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },` from the `NAV` array and remove `Repeat` from lucide-react imports if unused.

- [ ] **Step 2: Redirect `/admin/subscriptions` page to `/admin/members`**

Replace `app/admin/subscriptions/page.tsx` content with:
```tsx
import { redirect } from "next/navigation";

export default function SubscriptionsPage() {
  redirect("/admin/members");
}
```

- [ ] **Step 3: Verify build and typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/widgets/admin-shell/ui/sidebar.tsx app/admin/subscriptions/page.tsx
git commit -m "refactor(admin): remove subscriptions sidebar link and redirect /admin/subscriptions route"
```
