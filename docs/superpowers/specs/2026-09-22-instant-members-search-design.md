# Instant Members Search & Filter Design

## Overview
Transform the members directory search and status filter (`MembersFilters`) into an optimized, automatic live search component in Next.js App Router. Users will see search results dynamically while typing without needing to press `Enter` or click a "Search" button.

## Requirements & Scope
- **Debounced Instant Search**: Type in the search input and automatically update results after 300ms of typing inactivity.
- **Immediate Status Filter**: Changing the status dropdown updates results immediately.
- **URL Synchronization**: Keep `q`, `status`, and `page` in sync with URL parameters (`?q=...&status=...&page=1`) so searches remain bookmarkable and trigger Next.js Server Component re-rendering.
- **Reset Pagination**: Automatically reset `page` parameter back to `1` whenever the search term or status filter changes.
- **Non-blocking Visual Feedback**: Indicate background server fetching using React `useTransition` (`isPending`) without freezing UI typing.
- **Remove Redundant Button**: Remove the explicit "Search" submit button.

## Component Architecture & State Management

### Component: `MembersFilters` (`src/widgets/members-table/ui/members-filters.tsx`)
- Directive: `'use client'`
- Local State: `searchTerm` (string, initialized with `q` prop/searchParam)
- Hooks used:
  - `useRouter` from `next/navigation`
  - `usePathname` from `next/navigation`
  - `useSearchParams` from `next/navigation`
  - `useTransition` from `react`
  - `useState`, `useEffect` from `react`

### Detailed Logic
1. **Local State Sync**: `searchTerm` initializes from `q` prop. If `q` changes externally (e.g. browser back/forward), sync `searchTerm`.
2. **Debounce Logic**: On `searchTerm` change:
   - Set up a `setTimeout` for 300ms.
   - When timer fires, check if `searchTerm` differs from current `searchParams.get("q")`.
   - If different, update `URLSearchParams`:
     - If `searchTerm.trim()` is non-empty, `params.set("q", searchTerm.trim())`, else `params.delete("q")`.
     - `params.set("page", "1")`.
     - Execute `startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))`.
3. **Status Change Logic**: On `<Select>` `onChange`:
   - Get selected value.
   - Update `URLSearchParams`:
     - If value is not `"all"`, `params.set("status", value)`, else `params.delete("status")`.
     - `params.set("page", "1")`.
     - Execute `startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))`.

## Verification Plan
- **Keystroke Responsiveness**: Ensure no input lag while typing rapidly.
- **URL Sync**: Verify `?q=` updates 300ms after user stops typing.
- **Status Change**: Verify selecting status immediately changes the URL.
- **Page Reset**: Verify changing search query or status resets `page=1` in URL.
- **Navigation Safety**: Verify back/forward browser navigation works cleanly.
