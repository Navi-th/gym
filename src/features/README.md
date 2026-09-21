# `features/` — user actions

In FSD, `features` holds **user interactions that change state** — the verb
layer. Entities are the nouns ("a Member"); features are the actions ("save a
member", "record a payment").

## What lives here

| Slice | Module | Status |
|---|---|---|
| `save-member/` | 4 | ✅ create **and** edit |
| `archive-member/` | 4 | ✅ soft delete |
| `assign-plan/` | 5 | ✅ start a subscription |
| `manage-subscription/` | 5 | ✅ renew **and** freeze |
| `save-plan/` | 5b | ✅ create **and** edit a plan |
| `retire-plan/` | 5b | ✅ retire / restore |
| `record-payment/` | 6 | ✅ record, optionally renewing |
| `send-reminder/` | 7 | ✅ render, log, open WhatsApp |
| `run-reminders/` | 8 | planned (scheduled sends) |

## Why some features cover two actions

Two slices on the same layer may not import each other, so splitting actions
that share all their plumbing means duplicating it and letting the copies
drift. Where two actions are genuinely the same operation, they are one slice
with a mode or an action discriminator:

- **`save-member`**, **`save-plan`** — add and edit share every field.
- **`manage-subscription`** — renew and freeze both just push the end date out
  and post to the same endpoint. They differ in intent, not mechanics.

A feature is only split when the actions really are different, as
`archive-member` is from `save-member`, and `retire-plan` is from `save-plan`.

## The rule

A feature may import from `entities` and `shared` — never from `widgets` or
`_pages`, and never from another feature. If two features need the same thing,
that thing belongs in `entities` or `shared`.

Enforced by `npm run lint:fsd`. See `ARCHITECTURE.md`.
