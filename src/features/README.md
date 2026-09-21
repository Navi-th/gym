# `features/` — user actions

In FSD, `features` holds **user interactions that change state** — the verb
layer. Entities are the nouns ("a Member"); features are the actions
("save a member", "archive a member", "record a payment").

## What lives here

| Slice | Module | Status |
|---|---|---|
| `save-member/` | 4 | ✅ create **and** edit |
| `archive-member/` | 4 | ✅ soft delete |
| `record-payment/` | 6 | planned |
| `send-reminder/` | 8 | planned |

## Why `save-member` and not `add-member` + `edit-member`

They would share every single field. Under FSD two slices on the same layer
may not import each other, so splitting them would mean duplicating the whole
form — and duplicated forms drift. One slice with a `mode` prop is the honest
modelling: adding and editing are the same user action, "save this member".

## The rule

A feature may import from `entities` and `shared` — never from `widgets` or
`_pages`, and never from another feature. If two features need the same thing,
that thing belongs in `entities` or `shared`.

Enforced by `npm run lint:fsd`. See `ARCHITECTURE.md`.
