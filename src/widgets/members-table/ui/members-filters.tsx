"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/shared/ui";
import { STATUS_META, type MemberStatus, type MemberSortOption } from "@/entities/member";
import type { Plan } from "@/entities/plan";

const FILTERABLE: MemberStatus[] = [
  "active",
  "expiring_soon",
  "expired",
  "frozen",
];

const SORT_OPTIONS: { value: MemberSortOption; label: string }[] = [
  { value: "newest", label: "Newest joined" },
  { value: "expiry_asc", label: "Expiring soonest" },
  { value: "oldest", label: "Oldest joined" },
  { value: "name_asc", label: "Name (A–Z)" },
];

/**
 * Optimized debounced live search, status filter, plan filter, and sort order component.
 *
 * Keeps query, status, planId, and sort in sync with URL searchParams, resetting pagination
 * to page 1 on every filter change. Uses useTransition for non-blocking UI updates.
 */
export function MembersFilters({
  q,
  status,
  planId,
  sort,
  plans,
}: {
  q: string;
  status: string;
  planId: string;
  sort: string;
  plans: Plan[];
}) {
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

  const updateParam = (key: string, value: string, defaultValue: string = "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 animate-pulse pointer-events-none">
            Searching…
          </div>
        )}
      </div>

      <Select
        name="status"
        value={status}
        onChange={(e) => updateParam("status", e.target.value, "all")}
        className="max-w-[170px]"
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {FILTERABLE.map((value) => (
          <option key={value} value={value}>
            {STATUS_META[value]?.label ?? value}
          </option>
        ))}
      </Select>

      <Select
        name="planId"
        value={planId}
        onChange={(e) => updateParam("planId", e.target.value, "all")}
        className="max-w-[170px]"
        aria-label="Filter by plan"
      >
        <option value="all">All plans</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <Select
        name="sort"
        value={sort}
        onChange={(e) => updateParam("sort", e.target.value, "newest")}
        className="max-w-[170px]"
        aria-label="Sort order"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

