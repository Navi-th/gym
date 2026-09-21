# `features/` — reserved layer

This layer is intentionally **empty** right now.

In FSD, `features` holds **user interactions that change state** — the verb
layer. Entities are the nouns ("a Member"); features are the actions ("add a
member", "archive a member", "record a payment", "send a reminder").

It stays empty until module 4 because nothing in the admin panel is writable
yet. The dashboard is read-only, so it is composed of `entities` + `widgets`
only.

## What will land here

| Slice | Module |
|---|---|
| `add-member/` | 4 |
| `edit-member/` | 4 |
| `archive-member/` | 4 |
| `renew-subscription/` | 5 |
| `freeze-subscription/` | 5 |
| `record-payment/` | 6 |
| `send-reminder/` | 8 |

## The rule

A feature may import from `entities` and `shared` — never from `widgets` or
`_pages`, and never from another feature. If two features need the same thing,
that thing belongs in `entities` or `shared`.

See `ARCHITECTURE.md` at the repo root for the full layer rules.
