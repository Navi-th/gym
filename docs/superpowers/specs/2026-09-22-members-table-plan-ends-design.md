# Consolidate Subscriptions into Members Directory Design Spec

**Date:** 2026-09-22  
**Status:** Approved  

## Overview
This spec details replacing the standalone `/admin/subscriptions` route with an enhanced `/admin/members` directory table. The updated table incorporates **Plan** names, **Ends** (expiration dates with relative days remaining), and status badges directly, streamlining daily gym management.

---

## Architecture & Data Flow

### 1. Entity Layer (`src/entities/member`)
- **Type Update**:
  - Update `MemberWithStatus` in `src/entities/member/api/get-members.ts` to include:
    ```ts
    planName: string | null;
    ```
- **Query Optimization**:
  - In `getMembersCached`, update `db.select()` to left join the `plans` table (`members.planId = plans.id`):
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
    ```

---

### 2. UI Component Layer (`src/widgets/members-table`)

- **Table Header & Layout**:
  - Columns: `Member` | `Phone` | `Plan` | `Ends` | `Status` | `Actions`
- **Cell Rendering**:
  - **Plan**: Renders `member.planName ?? "—"` with medium weight text styling.
  - **Ends**: Renders formatted end date (`formatDate(member.planEnd)`) and relative time label (`formatRelativeDays(member.daysLeft)`).
  - **Status**: Renders `MemberStatusBadge`.
  - **Actions**: Renders `Manage` link pointing to `/admin/members/[id]`.

---

### 3. Navigation & Route Consolidation

- **Sidebar Navigation (`src/widgets/admin-shell/ui/sidebar.tsx`)**:
  - Remove `{ href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat }` from the `NAV` array.
- **Route Redirection (`app/admin/subscriptions/page.tsx`)**:
  - Issue a Next.js server-side `redirect("/admin/members")` when `/admin/subscriptions` is accessed.

---

## Verification Plan

- **Automated Check**:
  - Run `npm run build` or typecheck to verify all TypeScript types compile cleanly.
- **Manual Verification**:
  - Navigate to `/admin/members` and verify **Plan** and **Ends** columns are visible and styled consistently.
  - Test members with active plans, expiring plans, expired plans, and no plans to ensure accurate fallback rendering.
  - Try visiting `/admin/subscriptions` directly in the browser and verify it seamlessly redirects to `/admin/members`.
