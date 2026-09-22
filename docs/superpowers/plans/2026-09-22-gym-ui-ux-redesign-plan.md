# PULSE GYM UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PULSE GYM into a mobile-first, high-precision gym management portal with tactile 24px rounded cards, high-vis neon lime accents, segmented pill tracks, and an 8pt grid layout.

**Architecture:** Update central CSS design tokens in `app/globals.css`, introduce shared UI primitives (`SegmentedTrack`, `StatTile`, `GroupedListCard`), revamp the `AdminShell` widget, and refactor page components (`admin-dashboard`, `members`, `plans`, `reminders`) to follow the mobile-first precision layout.

**Tech Stack:** Next.js 14 (App Router), Feature-Sliced Design (FSD v2.1), Tailwind CSS, Lucide Icons, TypeScript, Vitest.

## Global Constraints

- **Theme Base**: Light porcelain background (`oklch(0.97 0.005 250)`), pure white card surfaces (`oklch(1 0 0)`), electric volt lime accent (`oklch(0.88 0.25 132)`).
- **Typography**: Google Font `Plus Jakarta Sans` for headers and UI body text, `JetBrains Mono` for tabular financial numbers.
- **8pt Spacing Grid**: Margins `16px` (`px-4`), card padding `20px`/`24px` (`p-5`/`p-6`), card gaps `16px` (`gap-4`).
- **Corner Radius**: `24px` for main cards, `16px` for stat tiles, `9999px` for pills.
- **Zero AI Anti-Patterns**: No purple-to-blue gradients, no Inter-everywhere, no card-in-card nesting, no italic headers.

---

### Task 1: CSS Design Tokens & Typography Foundation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Google Fonts (`Plus Jakarta Sans`), OKLCH CSS tokens
- Produces: CSS variables (`--color-bg-root`, `--color-surface-card`, `--color-accent-lime`, `--radius-card`, `--radius-pill`)

- [ ] **Step 1: Update `app/globals.css` with locked light mode OKLCH tokens and 8pt grid variables**

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

:root {
  /* Canvas & Card Surfaces */
  --color-bg-root: oklch(0.97 0.005 250);       /* Soft Porcelain Canvas */
  --color-surface-card: oklch(1 0 0);           /* Pure White Floating Cards */
  --color-surface-subtle: oklch(0.94 0.005 250); /* Pill Track & Input Container */
  --color-border-hairline: oklch(0.92 0.005 250);/* Soft Hairline Divider Rule */

  /* Text & Ink Tokens */
  --color-text-primary: oklch(0.18 0.01 250);   /* Deep Charcoal Ink */
  --color-text-secondary: oklch(0.55 0.015 250);/* Muted Slate Gray */
  --color-text-tertiary: oklch(0.70 0.01 250); /* Light Placeholder Gray */

  /* Brand Accent & Highlights */
  --color-accent-lime: oklch(0.88 0.25 132);    /* Electric Volt Lime (#C4FF00) */
  --color-accent-lime-fg: oklch(0.12 0.02 250); /* Dark Ink Text on Lime Pills */
  
  /* Status Signals */
  --color-status-success: oklch(0.72 0.18 145); /* Emerald Active Badge */
  --color-status-warning: oklch(0.78 0.18 75);  /* Amber Expiring Badge */
  --color-status-error: oklch(0.62 0.22 25);    /* Crimson Expired Badge */

  /* Typography Scale */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Corner Radius Scale */
  --radius-card: 24px;
  --radius-stat: 16px;
  --radius-pill: 9999px;
  --radius-icon: 12px;
}

html, body {
  background-color: var(--color-bg-root);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}
```

- [ ] **Step 2: Verify `npm run dev` builds cleanly without CSS errors**

Run: `npm run dev` (or check running server logs)
Expected: Server starts cleanly with new font imports and root CSS variables active.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: configure OKLCH precision design tokens and Plus Jakarta Sans font"
```

---

### Task 2: Segmented Pill Track Component (`SegmentedTrack`)

**Files:**
- Create: `src/shared/ui/segmented-track.tsx`
- Modify: `src/shared/ui/index.ts`

**Interfaces:**
- Consumes: `SegmentedTrackProps` (`items: Array<{ id: string; label: string }>`, `activeId: string`, `onChange: (id: string) => void`)
- Produces: Accessible, responsive pill track container for switching view tabs without layout shifts.

- [ ] **Step 1: Implement `src/shared/ui/segmented-track.tsx`**

```tsx
import React from 'react';

export interface SegmentedTrackOption {
  id: string;
  label: string;
  count?: number;
}

export interface SegmentedTrackProps {
  options: SegmentedTrackOption[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export const SegmentedTrack: React.FC<SegmentedTrackProps> = ({
  options,
  activeId,
  onChange,
  ariaLabel = 'Segmented options',
}) => {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="h-12 bg-[#F0F1F5] p-1 rounded-full flex items-center gap-1 w-full sm:w-auto"
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`h-full flex-1 sm:flex-initial px-5 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-150 select-none ${
              isActive
                ? 'bg-[#C4FF00] text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-900/10 text-slate-900' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Re-export from `src/shared/ui/index.ts`**

```typescript
export * from './segmented-track';
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/segmented-track.tsx src/shared/ui/index.ts
git commit -m "feat(ui): add SegmentedTrack component for pill toggles"
```

---

### Task 3: Micro-Stat Tile Component (`StatTile`) & Grouped List Container (`GroupedListCard`)

**Files:**
- Create: `src/shared/ui/stat-tile.tsx`
- Create: `src/shared/ui/grouped-list-card.tsx`
- Modify: `src/shared/ui/index.ts`

**Interfaces:**
- Consumes: Icon ReactNode, main metric value, sub-label string, item list with chevrons
- Produces: Standardized stat tiles (`rounded-2xl`) and grouped list rows (`rounded-[24px]`)

- [ ] **Step 1: Create `src/shared/ui/stat-tile.tsx`**

```tsx
import React from 'react';

export interface StatTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  onClick?: () => void;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  value,
  label,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[16px] p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-32 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 truncate mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create `src/shared/ui/grouped-list-card.tsx`**

```tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface GroupedListItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export interface GroupedListCardProps {
  title?: string;
  items: GroupedListItem[];
}

export const GroupedListCard: React.FC<GroupedListCardProps> = ({
  title,
  items,
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-5 py-4 border-b border-slate-100 text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
          {title}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className={`px-5 py-4 flex items-center justify-between transition-colors ${
              item.onClick ? 'cursor-pointer hover:bg-slate-50/80' : ''
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>{item.title}</span>
                {item.badge}
              </div>
              {item.subtitle && (
                <div className="text-xs text-slate-500">{item.subtitle}</div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              {item.meta && <span>{item.meta}</span>}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Export primitives from `src/shared/ui/index.ts`**

```typescript
export * from './stat-tile';
export * from './grouped-list-card';
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui/stat-tile.tsx src/shared/ui/grouped-list-card.tsx src/shared/ui/index.ts
git commit -m "feat(ui): add StatTile and GroupedListCard components"
```

---

### Task 4: Revamp Admin Shell & Navigation (`AdminShell`)

**Files:**
- Modify: `src/widgets/admin-shell/ui/admin-shell.tsx`
- Modify: `src/widgets/admin-shell/ui/sidebar.tsx`

**Interfaces:**
- Consumes: Navigation items, child pages
- Produces: Ergonomic mobile header with bottom tab bar, expanding to 240px rail on desktop.

- [ ] **Step 1: Refactor `src/widgets/admin-shell/ui/sidebar.tsx` to use high-precision dark/light styling and icons**

- [ ] **Step 2: Update `src/widgets/admin-shell/ui/admin-shell.tsx` with mobile bottom navigation bar (`backdrop-blur-md bg-white/90`)**

- [ ] **Step 3: Commit**

```bash
git add src/widgets/admin-shell/
git commit -m "refactor(admin-shell): apply mobile-first bottom tab bar and precision top header"
```

---

### Task 5: Redesign Admin Dashboard Page View

**Files:**
- Modify: `src/_pages/admin-dashboard/ui/admin-dashboard-page.tsx`

**Interfaces:**
- Consumes: Members data, subscriptions status, financial stats
- Produces: Refactored dashboard matching 8pt grid, segmented track, 3-tile micro stat row, and grouped action cards.

- [ ] **Step 1: Update `admin-dashboard-page.tsx` to render the modern segmented track, 3-stat tile grid (`StatTile`), and `GroupedListCard` for renewals & expirations queue**

- [ ] **Step 2: Test page rendering via `npm run dev` and ensure no runtime crashes**

- [ ] **Step 3: Commit**

```bash
git add src/_pages/admin-dashboard/
git commit -m "feat(dashboard): redesign admin dashboard with mobile-first precision layout"
```

---

## Plan Review & Handoff

I'm using the `writing-plans` skill to create the implementation plan.

Plan complete and saved to `docs/superpowers/plans/2026-09-22-gym-ui-ux-redesign-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach would you like to take?
