# Architecture

PULSE GYM uses **[Feature-Sliced Design](https://feature-sliced.design)** (FSD v2.1)
to keep the codebase navigable as modules are added.

FSD is not a folder convention you follow by vibe. It is one rule, applied
consistently, plus a vocabulary.

---

## The one idea

> **A layer may only import from layers below it.**

```
  app/          Next.js routing only — thin re-exports
   │
   ▼
  src/_app      FSD App layer      route handlers, global setup
   │
   ▼
  src/_pages    FSD Pages layer    fetch data, compose widgets
   │
   ▼
  src/widgets   FSD Widgets layer  self-contained UI blocks
   │
   ▼
  src/features  FSD Features layer user ACTIONS (add, renew, send…)
   │
   ▼
  src/entities  FSD Entities layer business NOUNS (member, plan, payment)
   │
   ▼
  src/shared    FSD Shared layer   primitives, no business knowledge
```

Nothing flows upward. `entities/member` cannot know that a dashboard exists.
That is what makes the modules independently changeable — and what stops a
small change in one screen from breaking another.

**The naming tells you which is which:**

| Layer | Answers | Example |
|---|---|---|
| `entities` | *What is it?* | a Member, a Plan, a Payment |
| `features` | *What can you do to it?* | add a member, renew a plan |
| `widgets` | *What does it look like?* | the renewals queue table |
| `_pages` | *What is on this screen?* | the dashboard |

---

## Directory map

```
gym/
├── app/                          Next.js routing manifest ONLY
│   ├── layout.tsx                root layout (imports globals.css)
│   ├── globals.css
│   ├── page.tsx                  -> re-export from @/_pages/home
│   ├── admin/
│   │   ├── layout.tsx            renders <AdminShell>
│   │   ├── page.tsx              -> re-export from @/_pages/admin-dashboard
│   │   └── api/ping/route.ts     -> re-export from @/_app/api-routes
│   └── api/health/route.ts       -> re-export from @/_app/api-routes
│
└── src/
    ├── _app/                     FSD App layer
    │   └── api-routes/           getHealth, getAdminPing + index.ts
    ├── _pages/                   FSD Pages layer
    │   ├── home/
    │   └── admin-dashboard/
    ├── widgets/
    │   ├── admin-shell/          owns sidebar.tsx — see "same-layer" rule
    │   ├── member-stats/
    │   ├── plans-table/
    │   └── renewals-queue/
    ├── features/                 RESERVED — see src/features/README.md
    ├── entities/
    │   ├── member/               model/  api/  ui/   <- the richest one
    │   ├── plan/
    │   ├── subscription/
    │   ├── payment/
    │   └── message/
    └── shared/
        ├── ui/                   Button Card Input Table  (no domain knowledge)
        ├── lib/                  cn() format helpers
        ├── db/                   Drizzle schema + getDb()
        ├── config/               APP_NAME, CURRENCY_SYMBOL, DATE_LOCALE
        └── types/                CloudflareEnv augmentation
```

**Segments inside a slice:** `ui/` (components), `model/` (types + pure logic),
`api/` (data access), `lib/` (slice-local helpers), `config/`.

**Every slice has an `index.ts`.** That is its *public API*. You import
`@/entities/member` — never `@/entities/member/model/status`.

---

## The three rules

1. **No upward imports.** `entities` must not import `widgets`.
2. **No cross-slice imports on the same layer.**
   `widgets/plans-table` must not import `widgets/renewals-queue`.
   
   *Exception:* `shared` and `_app` are built from **segments**, not slices, so
their segments may reference each other freely. This is per the FSD spec.
3. **Import the public API, not the internals.**
   `@/entities/member` ✅ — `@/entities/member/api/get-members` ❌

All three are enforced by `npm run lint:fsd`. See below.

---

## Where does new code go?

| You are writing… | It goes in | Layer |
|---|---|---|
| A new screen | `src/_pages/<name>/ui/` + barrel + `app/<route>/page.tsx` re-export | pages |
| A reusable chunk of a screen | `src/widgets/<name>/ui/` | widgets |
| A button that adds a member | `src/features/add-member/` | features |
| "What is a Member?" / status rules | `src/entities/member/model/` | entities |
| A query for members | `src/entities/member/api/` | entities |
| A badge showing member status | `src/entities/member/ui/` | entities |
| A generic Button, or `cn()` | `src/shared/ui/`, `src/shared/lib/` | shared |
| An HTTP endpoint | `src/_app/api-routes/<name>.ts` + `app/**/route.ts` re-export | _app |
| A currency or app constant | `src/shared/config/` | shared |

### The test that settles arguments

> **Does it know what a Member is?**
>
> - No, and it is reusable → `shared`
> - Yes, and it *is* member data or logic → `entities/member`
> - Yes, and it *does something* to a member → `features/…`
> - Yes, and it arranges members on screen → `widgets` / `_pages`

If two features need the same code, it belongs in `entities` or `shared` —
never imported feature-to-feature.

---

## Why `app/` is at the repo root

`src/app` collides with FSD's own `app` layer, and Next.js forbids both
existing. The FSD docs recommend keeping Next's routing folder at the **project
root** and reserving `src/` for FSD code — so that is what we do. FSD's App
layer is therefore named `src/_app`.

Consequence: **everything in `app/` should be a thin re-export.**

```tsx
// app/admin/page.tsx
export { AdminDashboardPage as default } from "@/_pages/admin-dashboard";
export const dynamic = "force-dynamic";
```

That keeps `app/` a readable routing manifest, and keeps every line of real
logic testable without going through a URL.

---

## Constraints discovered the hard way

These are not style opinions — they are things that break if you move them.

**1. Route segment config must stay in `app/`.**
`export const dynamic = "force-dynamic"` cannot live in `_pages`. Next.js reads
it statically at build time. `/admin` reads D1 per request, so without it the
build tries to prerender the page with no database binding.

**2. Tailwind's `content` globs must cover both roots.**
```ts
content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"]
```
Get this wrong and the build still **passes** while the page renders completely
unstyled. It is the one failure that green CI will not catch.

**3. The Drizzle schema lives in `shared/db/schema.ts`, not split per entity.**
The tables reference each other (`members` → `plans`, `messages` →
`subscriptions`), so splitting them by entity creates circular imports between
slices. The schema is infrastructure; entities own the *queries*.

**4. `*/` inside a block comment ends it.**
Writing `entities/*/ui` in a doc comment terminates the comment early and
turns the rest into code — `TS1160: Unterminated template literal`. Escape it
as `entities/**\/ui` or reword.

---

## Enforcing the rules

```bash
npm run lint:fsd    # layer boundaries only — fast, zero dependencies
npm run verify      # lint:fsd + tsc --noEmit + next build
```

The checker is `scripts/check-fsd-layers.mjs`. Run it before every commit; a
pre-commit hook is not wired up yet.

It reports three violation types, all verified to fire:

```
[upward-import]  src/shared/db/x.ts -> @/widgets/member-stats
[deep-import]    src/x.ts -> @/entities/member/api/get-members
[cross-slice]    src/widgets/plans-table/x.ts -> @/widgets/renewals-queue
```

---

## Roadmap by layer

| Module | Lands in | Layer |
|---|---|---|
| 4 · Members CRUD | `entities/member/api`, `features/add-member`, `_pages/members` | all |
| 5 · Plans & subscriptions | `entities/subscription`, `features/renew-subscription` | entities + features |
| 6 · Payments | `entities/payment`, `features/record-payment` | entities + features |
| 7 · WhatsApp send | `entities/message/api`, `features/send-reminder` | entities + features |
| 8 · Auto reminders | `_app/api-routes/cron`, `entities/message/model` | _app + entities |

See `src/features/README.md` for the features layer specifically.
