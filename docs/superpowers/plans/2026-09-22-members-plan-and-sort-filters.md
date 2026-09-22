# Members Plan Filtering and Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Plan (`planId`) filtering and Sort Order (`sort`) dropdowns to the Members directory and backend `getMembers` query.

**Architecture:** Extend `getMembers` query with `planId` SQL condition and custom `orderBy` sorting (`newest`, `oldest`, `expiry_asc`, `name_asc`). Update `MembersFilters` client component to render Plan and Sort select dropdowns, syncing selections to URL query params using `useTransition`. Update `MembersPage` to fetch plans and pass `searchParams`.

**Tech Stack:** Drizzle ORM (SQLite / D1), Next.js App Router, React 19, TypeScript, TailwindCSS.

## Global Constraints

- **Sort options:** `"newest"` (default: `desc(createdAt)`), `"expiry_asc"` (`asc(planEnd)`), `"oldest"` (`asc(createdAt)`), `"name_asc"` (`asc(fullName)`).
- **Default Page Reset:** Reset `page=1` when `planId` or `sort` changes.

---

### Task 1: Update `getMembers` API query to support `planId` and `sort`

**Files:**
- Modify: `src/entities/member/api/get-members.ts`

**Interfaces:**
- Consumes: `MemberFilter` options: `q`, `status`, `planId`, `sort`, `page`, `pageSize`
- Produces: Paginated list of members filtered by `planId` and sorted by `sort`

- [ ] **Step 1: Extend `MemberFilter` type and query builder**

Update `src/entities/member/api/get-members.ts`:
1. Define `MemberSortOption = "newest" | "oldest" | "expiry_asc" | "name_asc"`.
2. Add `planId?: string | "all" | null` and `sort?: MemberSortOption | null` to `MemberFilter`.
3. In `buildMemberConditions`: add `if (planId && planId !== "all") conditions.push(eq(membersTable.planId, planId));`.
4. In `getMembersCached`: determine `orderBy` SQL expression based on `sort`:
   - `"oldest"` -> `asc(membersTable.createdAt)`
   - `"expiry_asc"` -> `asc(membersTable.planEnd)`
   - `"name_asc"` -> `asc(membersTable.fullName)`
   - default `"newest"` -> `desc(membersTable.createdAt)`

- [ ] **Step 2: Run type check to verify query signatures**

Run `npx tsc --noEmit` to verify zero errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/entities/member/api/get-members.ts
git commit -m "feat(member): add planId filter and sort order to getMembers API"
```

---

### Task 2: Update `MembersFilters` UI & `MembersPage` integration

**Files:**
- Modify: `src/widgets/members-table/ui/members-filters.tsx`
- Modify: `src/_pages/members/ui/members-page.tsx`

**Interfaces:**
- Consumes: `plans: Plan[]`, `planId: string`, `sort: string` props
- Produces: Rendered Plan and Sort dropdowns syncing to URL params

- [ ] **Step 1: Update `MembersFilters` props and layout**

Update `src/widgets/members-table/ui/members-filters.tsx` to accept `plans`, `planId`, `sort` and render dropdowns for Plan and Sort. On change, update URL searchParams (`planId`, `sort`) and reset `page=1`.

- [ ] **Step 2: Update `MembersPage` to fetch `getPlans()` and pass props**

In `src/_pages/members/ui/members-page.tsx`:
1. Call `await getPlans()` in `MembersPage`.
2. Pass `plans`, `planId`, `sort` to `<MembersFilters />`.
3. Pass `planId` and `sort` to `MembersListSection`.
4. Update `Suspense` key: `${q}-${status}-${planId}-${sort}-${page}`.

- [ ] **Step 3: Run type check & build verification**

Run `npx tsc --noEmit` to confirm no errors across pages and components.

- [ ] **Step 4: Commit changes**

```bash
git add src/widgets/members-table/ui/members-filters.tsx src/_pages/members/ui/members-page.tsx docs/superpowers/plans/2026-09-22-members-plan-and-sort-filters.md
git commit -m "feat(members): add plan and sort dropdown filters to UI and page"
```
