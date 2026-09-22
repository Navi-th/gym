# PULSE GYM — UI/UX Redesign Blueprint & Design Specification
*Hallmark Anti-Slop Specification & Mobile-First Precision Architecture*
*Date: 2026-09-22*
*Pre-emit Self-Critique: P5 H5 E5 S5 R5 V5*

---

## 1. Executive Summary & Design Vision

**PULSE GYM** is a mobile-first gym management web application for gym owners, managers, and front-desk staff to monitor revenue, track member check-ins, manage subscriptions, and send automated expiration reminders.

This redesign focuses on **Flawless Layout Alignment, Micro-Precision Spacing, and High-End iOS Ergonomics**:
- **8pt Grid System**: Standardized margins (`16px` outer gutters), uniform card padding (`20px` / `24px`), and consistent section gaps (`16px` / `20px`).
- **Tactile Rounded Containers**: Precision `24px` radius for primary cards and `16px` radius for stat tiles.
- **Vibrant Accent**: Electric Neon Volt Lime (`oklch(0.88 0.25 132)`) reserved strictly for active states, key CTAs, and urgent indicators.
- **Pill-Shaped Segmented Tracks**: Flush-fit toggle tracks (`rounded-full`) for switching views without layout shifts.
- **Structured Grouped List Cards**: Clean row items separated by 1px hairline dividers with right chevron indicators (`>`).
- **Mobile-First Layout**: Ergonomic touch-first mobile interface that scales seamlessly into a clean, multi-pane desktop workstation.

---

## 2. Hallmark Anti-Slop Audit & Design DNA

We explicitly eradicate the 10 AI design anti-patterns in favor of a pristine, high-precision visual layout:
1. **No Purple-to-Blue Gradients**: Soft porcelain background (`oklch(0.97 0.005 250)`) + pure white card containers (`oklch(1 0 0)`) + high-vis electric neon lime accents.
2. **No Inter-Everywhere**: Pairing display face `Plus Jakarta Sans` / `Outfit` (bold geometric curves) with `SF Pro` / `Plus Jakarta Sans` for UI text and `JetBrains Mono` for tabular data.
3. **No Cluttered 3-Column AI Grids**: Clean 3-column micro-stat row + structured full-width list containers with strict baseline alignment.
4. **No Card-in-Card Nesting**: Clean single-layer white card containers floating cleanly on a soft porcelain canvas.
5. **No Gradient Headline Text**: High-contrast solid dark ink (`oklch(0.18 0.01 250)`).
6. **No Side-Stripe Colored Borders**: Pills, micro-badge chips, and subtle status icon containers (`rounded-xl`).
7. **No Redrawn Desktop Chrome**: Native app-like mobile header with back button, screen title, and top action pills.
8. **No Pure #000 / #fff**: Calibrated OKLCH soft light mode palette with zero harsh glare.
9. **No Messy Unaligned Spacing**: Every element snapped strictly to an 8pt grid (`8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
10. **No Standard Template Fall-Through**: Purpose-built for 1-thumb front-desk gym operation (rapid check-in, 1-click WhatsApp renewal dispatch).

---

## 3. Design Tokens Architecture (OKLCH Light Mode)

```css
/* Hallmark Locked Tokens — Mobile-First Precision Light */
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

  /* Corner Radius & Spacing Grid */
  --radius-card: 24px;                          /* Big Rounded Containers */
  --radius-stat: 16px;                          /* Stat Card Containers */
  --radius-pill: 9999px;                        /* Segmented Toggles & Tag Chips */
  --radius-icon: 12px;                          /* Icon Badge Square */

  --space-gutter: 16px;                         /* Mobile Edge Padding */
  --space-card-p: 20px;                         /* Card Inner Padding */
  --space-gap-y: 16px;                          /* Section Vertical Gap */
}
```

---

## 4. Mobile-First Layout & Alignment Architecture

### A. Top Navigation Header (Exact Baseline Alignment)
- **Container**: `h-14 px-4 flex items-center justify-between`
- **Left Action**: `w-10 h-10 rounded-full bg-white border border-hairline flex items-center justify-center` (Circular back button).
- **Center Title**: `text-lg font-bold text-primary tracking-tight` ("Gym Analytics" / "Members").
- **Right Action**: `w-10 h-10 rounded-full bg-white border border-hairline flex items-center justify-center` (Search / Notifications).

### B. Segmented Track Selector (Flush Pill Track)
- **Container**: `h-12 bg-surface-subtle p-1 rounded-full flex items-center gap-1`
- **Active Segment**: `h-full bg-accent-lime text-accent-lime-fg font-semibold rounded-full px-6 flex items-center justify-center text-sm shadow-sm transition-all`
- **Inactive Segment**: `h-full text-secondary hover:text-primary font-medium px-6 flex items-center justify-center text-sm`

### C. Main Data & Analytics Card (Precise Header & Sub-controls)
- **Container**: `bg-surface-card rounded-3xl p-5 border border-hairline shadow-sm space-y-4`
- **Header Row**: `flex items-center justify-between` (Title on Left, Navigation Arrows `< November >` on Right).
- **Filter Tags Row**: `flex items-center gap-2 overflow-x-auto no-scrollbar`
  - Active Tag: `bg-accent-lime text-accent-lime-fg text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1`
  - Inactive Tags: `bg-surface-subtle text-secondary text-xs font-medium px-3.5 py-1.5 rounded-full`
- **Primary Data View**: Clean revenue summary table & monthly comparison data cleanly formatted with tabular numbers.

### D. 3-Column Micro-Stat Cards Grid (Equal Width & Alignment)
- **Container**: `grid grid-cols-3 gap-3`
- **Stat Tile Architecture**:
  - `bg-surface-card rounded-2xl p-3.5 border border-hairline flex flex-col justify-between h-28`
  - Top: Icon badge `w-8 h-8 rounded-xl bg-surface-subtle flex items-center justify-center`
  - Middle: Primary metric `text-xl font-extrabold text-primary tracking-tight` (`$125`, `+18%`, `12`)
  - Bottom: Sub-label `text-[11px] font-medium text-secondary truncate` ("Avg check", "Growth", "Expiring")

### E. Grouped Action List Container (Precision Rows)
- **Container**: `bg-surface-card rounded-3xl border border-hairline divide-y divide-border-hairline overflow-hidden`
- **Row Item**: `px-5 py-4 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors cursor-pointer`
  - Left Label: `text-sm font-semibold text-primary` ("Expiring Memberships", "Unpaid Reminders")
  - Right Meta & Chevron: `flex items-center gap-2 text-xs font-medium text-secondary` (`12 Members <ChevronRight className="w-4 h-4 text-tertiary" />`)

### F. Floating Ergonomic Mobile Bottom Bar
- **Container**: `fixed bottom-0 left-0 right-0 h-16 bg-surface-card/90 backdrop-blur-md border-t border-hairline px-6 flex items-center justify-around z-50`
- **Tab Target**: `flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-secondary active:text-primary`

---

## 5. Desktop Workspace Alignment (Responsive Scaling)

On Desktop viewports (`>1024px`), the layout retains the exact same 8pt grid, rounded card geometry, and clean baseline alignments, expanding into a **3-Pane Desktop Dashboard**:

```
+---------------------------------------------------------------------------------------------------+
| [PULSE GYM]    [ Search members (Cmd+K) ]                     [Active: Main Studio] [+ Add Member]|
+---------------------------------------------------------------------------------------------------+
| LEFT RAIL      | CENTRAL FEED (70%)                              | RIGHT ACTION PANEL (30%)       |
| (240px)        | (Strict 8pt Alignment & Margins)                | (360px)                        |
|                |                                                 |                                |
|  [01] Dash     | +---------------------------------------------+ | +----------------------------+ |
|  [02] Members  | | Segmented Track: [ Overview | Renewals ]    | | | Instant Member Scan / ID   | |
|  [03] Plans    | +---------------------------------------------+ | | [ Phone / Barcode Input ]  | |
|  [04] Payments | | Main Data Card (Monthly Revenue & Metrics)  | | +----------------------------+ |
|  [05] Reminders| +---------------------------------------------+ | | Recent Receipts Feed       | |
|                | | Stat Cards Grid (Avg Check | Growth | Exp)  | | | - John D. ($120) • 10m ago | |
|                | +---------------------------------------------+ | | - Sarah M. ($350) • 1h ago | |
|                | | Grouped Action List (Expiring | Reminders)  | | +----------------------------+ |
+----------------+-------------------------------------------------+--------------------------------+
```

---

## 6. Implementation Checklist

1. **Grid & Tokens**: Inject 8pt spacing grid (`--space-gutter`, `--space-card-p`), `--radius-card: 24px`, and OKLCH light mode tokens in `app/globals.css`.
2. **Typography System**: Configure `Plus Jakarta Sans` for clean, high-precision geometry.
3. **Core UI Primitives**: Build `SegmentedTrack`, `StatTile`, `GroupedListCard`, and `HeaderNav` in `@/shared/ui`.
4. **Viewport Testing**: Verify pixel-perfect alignment across 320px, 375px, 414px, 768px, 1024px, and 1440px.

---
*End of Blueprint Specification*
