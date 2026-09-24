# Automation Foundation — Design

Date: 2026-09-24
Status: approved
Scope: make the reminder pipeline correct, then turn `automation_rules` into a working feature.

## Problem

Four defects make the reminder feature unable to do its job.

1. **A member can receive each reminder once, ever.** `buildDedupeKey` produces
   `<memberId>:<ruleId|->:<templateKey>` with no time component. `messages.dedupe_key`
   is UNIQUE, so once Aarav has had `expiry_7d` the row exists forever and every
   future renewal is rejected with 409. The reminder works only on a member's
   first term.
2. **The ledger records messages that were never sent.** `sendMessageHandler`
   writes `status: "sent"` *before* the browser opens WhatsApp. Closing the tab
   leaves a permanent "sent" row for a message nobody sent.
3. **The Reminders list has no memory.** It calls `selectRenewalsQueue`, which
   returns everyone expiring within 7 days. It cannot tell who was already
   messaged, so the same people reappear daily.
4. **`automation_rules` is dead data.** The table exists, `messages.rule_id`
   references it, and `scripts/seed.sql` seeds four rules — but nothing in
   `src/` or `app/` reads or writes it.

The cron/WhatsApp-provider work is deliberately **out of scope**: no provider is
configured, so a scheduled job could only pre-write rows. Rules are pure date
arithmetic and evaluate correctly at page render time.

## Non-goals

Login/auth, any sending provider (Meta Cloud API or BSP), template editing,
member freeze, Meta positional `{{1}}` reformatting, wiring `payment_due` and
`welcome`.

## Design

### 1. Dedupe key gains the membership period

`period` is the membership end date the message is about (`member.planEnd`),
or `"-"` when the member has no end date.

```
mem_1:rule_abc:expiry_7d:2026-10-15
```

One reminder per **membership term** instead of per member. Renewing changes
`planEnd`, so the next term is eligible again. It stays structurally impossible
to send twice for the same term.

No schema change and no migration: the period lives inside the existing
`dedupe_key` text column. Legacy rows keep their old-format keys and simply stop
matching, which unblocks members who were previously stuck.

`period` is supplied by the caller and defaults to the member's `planEnd`. It is
**always** the term end date — never "today" — because the period must identify
which membership the message was about, not when it was sent.

### 2. Honest statuses

| Status | Written when |
|---|---|
| `sent` | the browser successfully handed off to WhatsApp |
| `skipped` | the admin pressed Skip, or the member has no WhatsApp consent |
| `failed` | reserved for the future provider |

`queued`, `delivered` and `read` already exist in the status enum and stay unused.

**Blocking rule:** a row with `sent`, `skipped`, `delivered` or `read` blocks
re-sending for the same dedupe key. `failed` does not.

A duplicate throws `DuplicateMessageError` (409) as before. Retry-on-conflict is
not implemented because no retry path exists yet.

### 3. Send flow — one endpoint, one round trip

The server already knows the member's phone and the rendered body, so it builds
the finished `wa.me` link during page render and hands it to the client.

```
server page render:  renderTemplate(...) + buildWhatsAppLink(phone, rendered)
client Send:         const w = window.open(link)
                     if (!w) -> show error, do NOT commit
                     await submitReminder({ ..., status: "sent" })
client Skip:         await submitReminder({ ..., status: "skipped" })
```

`POST /admin/api/messages` becomes the commit endpoint and **stops returning a
link**. This is fewer lines than today: the handler no longer builds a link, and
there is no second endpoint.

The commit handler still renders the body **on the server** and owns
`rendered_body`. The client sends only identity plus an outcome, never the text,
so the stored body cannot be forged. Rendering is deterministic for a given
`period` (the `{{date}}` value is `member.planEnd`), so the recorded text matches
the text in the link the server handed out. A `skipped` row stores no body —
nothing was sent, so there is nothing to dispute.

Known ceiling: the link is built at page render, so if the membership is renewed
in another tab the prepared text is briefly stale. Reloading fixes it.


### 4. The rules engine

Pure, generic over row shape, no cross-entity imports — the same technique
`entities/payment/model/dues.ts` uses, because `scripts/check-fsd-layers.mjs`
forbids two entity slices importing each other.

```ts
selectDueForRule({ rule, people, today }): T[]
```

| trigger | fires when | status |
|---|---|---|
| `plan_expiring` | `0 <= daysLeft <= offsetDays` | wired |
| `payment_overdue` | `daysLeft < 0` | wired |
| `payment_due` | — | not wired, shown as such in the UI |
| `welcome` | — | not wired, shown as such in the UI |

Excluded from every rule: soft-deleted members, `stage === "frozen"` members
(their cover is paused; reminding them is wrong), and members with no `planEnd`
(no date to compute from).

`0 <= daysLeft <= offsetDays` is a **catch-up window**, not an exact-day match.
Because the dedupe key makes a second send for the same term impossible, a missed
day costs nothing and nobody gets skipped.

### 5. Queue assembly

Built inline in the Reminders server component, matching the house pattern
(`admin-dashboard.tsx` and `reminders-page.tsx` already compute their queues
inline), so no new orchestration module is introduced:

1. `getEnabledRules()` + `getAllMembers()` + `getMessageTemplates()`
2. for each rule, `selectDueForRule(...)`
3. drop members already blocked for that rule's dedupe key
4. render the template, build the `wa.me` link, order by `daysLeft` ascending

### 6. Screens

**Send (replaces `nudge-queue-table.tsx`).** One member at a time: name, code,
expiry, which rule flagged them, the rendered message, then Send / Skip and an
`n of m` counter. Members without consent show as Skip-only with a reason.

**Rules card (on the Reminders page).** Lists all four seeded rules with the
offset days, the template, and an on/off toggle. Inline editing of `offsetDays`
and `templateKey`. Unwired triggers render as "not wired yet" and cannot be
enabled — the API returns 422 as well.

## Files

New: `entities/automation/` (`model/types.ts`, `model/select.ts` + test,
`model/validate.ts`, `api/get-rules.ts`, `api/update-rule.ts`, `index.ts`) ·
`_app/api-routes/automation-rules.ts` ·
`app/admin/api/automation-rules/{route.ts,[id]/route.ts}` ·
`features/edit-rule/` · `_pages/reminders/ui/{automation-rules-card.tsx,send-queue.tsx}`

Changed: `entities/message/model/dedupe.ts` + test · `api/log-message.ts` ·
`api/get-messages.ts` · `index.ts` · `_app/api-routes/{messages.ts,index.ts}` ·
`features/send-reminder/*` · `_pages/reminders/ui/reminders-page.tsx` ·
`scripts/e2e/reminders.mjs`

Deleted: `_pages/reminders/ui/nudge-queue-table.tsx`, and `getSentTemplateKeys`
(exported, zero callers).

## Incidental fixes

- `scripts/seed.sql` seeded `billing_period = 'quarterly'`, which
  `validatePlanInput` rejects and the schema enum does not allow. Changed to
  `'monthly'`. Widening the enum was rejected: nothing depends on the value
  beyond a display label.
- `.env.example` documented a Cloudflare Access guard (`ACCESS_TEAM_DOMAIN`,
  `ACCESS_AUD`) removed in commit `71711ba`, and referenced a `DEPLOYMENT.md`
  that does not exist. Dead block removed.

## Verification

`npm run verify` (fsd-lint -> `tsc --noEmit` -> vitest -> `next build`), plus new
vitest coverage for the dedupe key and the rule engine (window boundaries,
frozen, no plan, deleted), plus an updated `scripts/e2e/reminders.mjs`.

## Deferred

The daily cron. It becomes necessary when a real sender exists — a provider
needs a scheduled trigger. The rules engine built here is what that trigger
drives.
