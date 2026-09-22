# Instant Members Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `MembersFilters` into an optimized live search component with debounced URL updates in Next.js App Router without requiring an Enter keystroke or Search button click.

**Architecture:** Convert `MembersFilters` to a `'use client'` component. Use local input state for zero-latency typing, debouncing updates to `useSearchParams` via `startTransition` and `router.replace` by 300ms. Status changes immediately update URL query parameters.

**Tech Stack:** React 19 / Next.js App Router (`useRouter`, `usePathname`, `useSearchParams`, `useTransition`), TypeScript, TailwindCSS.

## Global Constraints

- **File Path:** `src/widgets/members-table/ui/members-filters.tsx`
- **Debounce Duration:** 300ms
- **Default Page Reset:** Always set `page=1` when search query `q` or `status` changes.

---

### Task 1: Refactor `MembersFilters` to Client Component with Live Debounced Search

**Files:**
- Modify: `src/widgets/members-table/ui/members-filters.tsx`

**Interfaces:**
- Consumes: `q: string`, `status: string` props passed from `MembersPage`
- Produces: Updated URL parameters (`?q=...&status=...&page=1`) on the client side

- [ ] **Step 1: Convert `MembersFilters` to `'use client'` and implement hooks & debounced URL sync**

Update `src/widgets/members-table/ui/members-filters.tsx` to:
```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/shared/ui";
import { STATUS_META, type MemberStatus } from "@/entities/member";

const FILTERABLE: MemberStatus[] = [
  "active",
  "expiring_soon",
  "expired",
  "frozen",
];

export function MembersFilters({ q, status }: { q: string; status: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(q);

  // Sync local state if external q prop changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  // Debounced search term sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") ?? "";
      if (searchTerm.trim() === currentQ) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set("q", searchTerm.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs w-full">
        <Input
          name="q"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name, phone or member code…"
          aria-label="Search members"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 animate-pulse">
            Searching…
          </div>
        )}
      </div>

      <Select
        name="status"
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="max-w-[190px]"
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {FILTERABLE.map((value) => (
          <option key={value} value={value}>
            {STATUS_META[value]?.label ?? value}
          </option>
        ))}
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: Run type check & build verification**

Run `npm run build` or `npx tsc --noEmit` to verify zero TypeScript or syntax errors.

- [ ] **Step 3: Test live search functionality in browser or via test**

Verify typing triggers debounced URL update after 300ms and status dropdown selection updates immediately.

- [ ] **Step 4: Commit changes**

```bash
git add src/widgets/members-table/ui/members-filters.tsx docs/superpowers/plans/2026-09-22-instant-members-search.md
git commit -m "feat(members): implement debounced live search and status filter"
```
