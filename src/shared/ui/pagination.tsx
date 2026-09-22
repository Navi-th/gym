import Link from "next/link";
import { Button } from "./button";

export interface PaginationProps {
  /** Current page number (1-indexed). */
  page: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Total number of items across all pages. */
  totalCount: number;
  /** Number of items per page (default: 10). */
  pageSize?: number;
  /** Base URL path to build link hrefs. If not specified, defaults to current query string. */
  basePath?: string;
  /** Current search parameters object from Next.js page searchParams. */
  searchParams?: Record<string, string | string[] | undefined>;
  /** Parameter name used in URL search query (default: "page"). */
  pageParamName?: string;
  /** Optional callback for client-driven page changes. */
  onPageChange?: (page: number) => void;
  /** Optional custom CSS classes for wrapper container. */
  className?: string;
}

/**
  Generates array of page numbers and ellipsis indicators for clean pagination.
  Example output: [1, "...", 4, 5, 6, "...", 20]
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

/**
 * Reusable, accessible, and responsive pagination bar.
 *
 * Designed for server-rendered Next.js pages with URL search parameter persistence
 * or client component state callbacks.
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize = 10,
  basePath,
  searchParams = {},
  pageParamName = "page",
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalCount <= 0 || totalPages <= 1) {
    if (totalCount > 0) {
      return (
        <div className={`flex items-center justify-between pt-3 pb-1 text-xs text-zinc-500 font-medium ${className}`}>
          <span>Showing 1–{totalCount} of {totalCount} items</span>
        </div>
      );
    }
    return null;
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  /** Helper to build target URL with updated page query parameter */
  const buildPageUrl = (targetPage: number): string => {
    const params = new URLSearchParams();

    // Preserve existing search params except page
    Object.entries(searchParams).forEach(([key, val]) => {
      if (key !== pageParamName && val !== undefined) {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val);
        }
      }
    });

    if (targetPage > 1) {
      params.set(pageParamName, String(targetPage));
    }

    const queryString = params.toString();
    const prefix = basePath ?? "";
    return queryString ? `${prefix}?${queryString}` : prefix || "?";
  };

  const pages = getPageNumbers(page, totalPages);

  const renderPageButton = (p: number | "ellipsis", index: number) => {
    if (p === "ellipsis") {
      return (
        <span
          key={`ellipsis-${index}`}
          className="flex h-9 w-9 items-center justify-center text-xs font-semibold text-zinc-400 select-none"
        >
          •••
        </span>
      );
    }

    const isActive = p === page;

    if (onPageChange) {
      return (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-current={isActive ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
            isActive
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          {p}
        </button>
      );
    }

    return (
      <Link
        key={p}
        href={buildPageUrl(p)}
        aria-current={isActive ? "page" : undefined}
        aria-label={`Page ${p}`}
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
          isActive
            ? "bg-zinc-900 text-white shadow-sm"
            : "bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200"
        }`}
      >
        {p}
      </Link>
    );
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 ${className}`}
    >
      <div className="text-xs text-zinc-500 font-medium">
        Showing <span className="font-bold text-zinc-900">{startItem.toLocaleString()}</span> to{" "}
        <span className="font-bold text-zinc-900">{endItem.toLocaleString()}</span> of{" "}
        <span className="font-bold text-zinc-900">{totalCount.toLocaleString()}</span> items
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        {onPageChange ? (
          <Button
            variant="secondary"
            disabled={prevDisabled}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous Page"
            className="h-9 px-3 text-xs"
          >
            ← Prev
          </Button>
        ) : prevDisabled ? (
          <Button variant="secondary" disabled className="h-9 px-3 text-xs">
            ← Prev
          </Button>
        ) : (
          <Link href={buildPageUrl(page - 1)} aria-label="Previous Page">
            <Button variant="secondary" className="h-9 px-3 text-xs">
              ← Prev
            </Button>
          </Link>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) => renderPageButton(p, i))}
        </div>

        {/* Next Button */}
        {onPageChange ? (
          <Button
            variant="secondary"
            disabled={nextDisabled}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next Page"
            className="h-9 px-3 text-xs"
          >
            Next →
          </Button>
        ) : nextDisabled ? (
          <Button variant="secondary" disabled className="h-9 px-3 text-xs">
            Next →
          </Button>
        ) : (
          <Link href={buildPageUrl(page + 1)} aria-label="Next Page">
            <Button variant="secondary" className="h-9 px-3 text-xs">
              Next →
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
