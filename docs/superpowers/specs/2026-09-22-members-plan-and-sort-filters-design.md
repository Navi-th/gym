# Members Plan Filtering and Sorting Design

## Overview
Expand the Members Directory filtering bar (`MembersFilters`) and query layer (`getMembers`) to support filtering members by assigned **Plan** (`planId`) and sorting members by **Sort Order** (`sort`).

## Requirements & Scope
- **Plan Filter**: Filter members by specific `planId` or show all plans (`"all"`).
- **Sort Options**:
  - `newest`: Newest joined first (default, `desc(createdAt)`)
  - `expiry_asc`: Expiring soonest first (`asc(planEnd)`)
  - `oldest`: Oldest joined first (`asc(createdAt)`)
  - `name_asc`: Name A-Z (`asc(fullName)`)
- **URL Parameter Syncing**: Sync `planId` and `sort` into the URL searchParams alongside `q`, `status`, and `page`.
- **Reset Pagination**: Reset `page` parameter to `1` when `planId` or `sort` changes.

## Data Layer & API Changes

### 1. `src/entities/member/api/get-members.ts`
- Extend `MemberFilter`:
  ```ts
  export type MemberSortOption = "newest" | "oldest" | "expiry_asc" | "name_asc";

  export type MemberFilter = {
    q?: string | null;
    status?: MemberStatus | "all" | null;
    planId?: string | "all" | null;
    sort?: MemberSortOption | null;
    page?: number;
    pageSize?: number;
  };
  ```
- Update `buildMemberConditions`: Add condition `eq(membersTable.planId, planId)` when `planId` is provided and not `"all"`.
- Update `getMembersCached`: Apply appropriate `orderBy` based on `sort` option.

## UI & Page Changes

### 2. `src/widgets/members-table/ui/members-filters.tsx`
- Receive `plans: Plan[]`, `planId: string`, `sort: string` as props.
- Add `<Select>` for Plan options (All plans + dynamic plans from `plans` prop).
- Add `<Select>` for Sort options (Newest joined, Expiring soonest, Oldest joined, Name A-Z).
- Handle instant `onChange` for both selects with `router.replace` & `useTransition`.

### 3. `src/_pages/members/ui/members-page.tsx`
- Fetch available plans via `getPlans()`.
- Extract `planId` and `sort` searchParams.
- Pass parameters to `<MembersFilters />` and `<MembersListSection />`.
- Update `Suspense` key: `${q}-${status}-${planId}-${sort}-${page}`.

## Verification Plan
- **TypeScript Verification**: Run `npx tsc --noEmit` to verify type safety across all components.
- **Functionality Verification**: Verify filtering by plan updates URL and results list. Verify changing sort order re-sorts table rows correctly.
