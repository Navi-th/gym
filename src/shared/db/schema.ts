import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * PULSE GYM — D1 schema
 *
 * Conventions:
 * - `id` is a text primary key (nanoid-style id generated in app code).
 * - Dates are stored as ISO-8601 text (SQLite has no date type).
 * - Money is stored as integer minor units (cents) — never floats.
 * - `is_active` / `whatsapp_opt_in` are integers used as booleans (0/1).
 *
 * Lifecycle note: member `stage` only holds MANUAL states
 * (active | frozen). The distinction between "active" and
 * "expired" is DERIVED from `plan_end` vs today — see src/lib/members/status.ts.
 * That means there is no status column to drift out of sync and no cron needed
 * to flip members to "expired".
 */

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  billingPeriod: text("billing_period", { enum: ["monthly", "annual"] }).notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    memberCode: text("member_code").notNull(), // PULSE-0001
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(), // E.164
    email: text("email"),
    gender: text("gender", { enum: ["male", "female", "other"] }),

    planId: text("plan_id").references(() => plans.id),
    planStart: text("plan_start"),
    planEnd: text("plan_end"),
    frozenUntil: text("frozen_until"),

    stage: text("stage", { enum: ["active", "frozen"] })
      .notNull()
      .default("active"),

    whatsappOptIn: integer("whatsapp_opt_in", { mode: "boolean" })
      .notNull()
      .default(false),
    optInAt: text("opt_in_at"),

    joinedAt: text("joined_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"), // soft delete — history must survive
  },
  (t) => [
    index("idx_members_phone").on(t.phone),
    index("idx_members_plan_end").on(t.planEnd),
    index("idx_members_stage").on(t.stage),
  ]
);

// ---------------------------------------------------------------------------
// Subscriptions — the member <-> plan join over time
// ---------------------------------------------------------------------------
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    status: text("status", { enum: ["active", "expired", "frozen", "cancelled"] })
      .notNull()
      .default("active"),

    // SNAPSHOT of the plan price at signup. Plans change over time; historical
    // revenue must never silently re-price itself by joining the live plan row.
    priceCentsCharged: integer("price_cents_charged").notNull(),

    freezeDays: integer("freeze_days").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_subs_member").on(t.memberId),
    index("idx_subs_end").on(t.endDate),
  ]
);

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    subscriptionId: text("subscription_id").references(() => subscriptions.id),
    amountCents: integer("amount_cents").notNull(),
    method: text("method", { enum: ["cash", "upi", "card", "bank"] }).notNull(),
    paidAt: text("paid_at").notNull(),
    periodStart: text("period_start"),
    periodEnd: text("period_end"),
    reference: text("reference"),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_payments_member").on(t.memberId)]
);

// ---------------------------------------------------------------------------
// WhatsApp message templates
// Meta requires pre-approved TEMPLATES for business-initiated messages.
// A reminder IS business-initiated, so this table mirrors what is registered
// in the WhatsApp Manager. `category` should be "utility" for reminders —
// promo-sounding copy gets reclassified "marketing" or rejected outright.
// ---------------------------------------------------------------------------
export const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. expiry_7d
  language: text("language").notNull().default("en"),
  category: text("category", { enum: ["utility", "marketing", "authentication"] })
    .notNull()
    .default("utility"),
  body: text("body").notNull(), // "Hi {{name}}, {{plan}} expires on {{date}}."
  variables: text("variables"), // JSON array of variable names
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Automation rules — automation as DATA, not code.
// Changing "7 days before" to "3 days before" becomes a settings edit
// instead of a deploy.
// ---------------------------------------------------------------------------
export const automationRules = sqliteTable("automation_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger", {
    enum: ["plan_expiring", "payment_due", "payment_overdue", "welcome"],
  }).notNull(),
  offsetDays: integer("offset_days").notNull(), // 7 = seven days before end
  templateKey: text("template_key")
    .notNull()
    .references(() => messageTemplates.key),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Messages — the outbound ledger.
//
// `dedupe_key` is the single most important constraint in this schema: it makes
// double-sending STRUCTURALLY IMPOSSIBLE rather than a code convention. A
// retried cron that re-messages every member is how a gym loses its customer
// base in one afternoon.
//
// It is a plain column rather than a unique index over IFNULL(...) expressions
// for two reasons: SQLite treats NULLs as distinct in unique indexes (so the
// naive index would not actually prevent duplicates), and drizzle-kit cannot
// serialise expression indexes for SQLite. A computed idempotency key is
// simpler, greppable, and tool-friendly.
// ---------------------------------------------------------------------------
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    subscriptionId: text("subscription_id").references(() => subscriptions.id),
    ruleId: text("rule_id").references(() => automationRules.id),
    templateKey: text("template_key").notNull(),

    // Idempotency key: "<memberId>:<subscriptionId|->:<ruleId|->:<templateKey>"
    // Built by buildDedupeKey() — see src/lib/messaging/dedupe.ts
    dedupeKey: text("dedupe_key").notNull().unique(),

    toPhone: text("to_phone").notNull(),
    channel: text("channel").notNull().default("whatsapp"),
    status: text("status", {
      enum: ["queued", "sent", "delivered", "read", "failed", "skipped"],
    })
      .notNull()
      .default("queued"),
    providerMessageId: text("provider_message_id"),
    renderedBody: text("rendered_body"), // exactly what went out, for disputes
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    sentAt: text("sent_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_messages_member").on(t.memberId)]
);

// ---------------------------------------------------------------------------
// Counters — atomic sequence for member_code (PULSE-0001).
// Safe without explicit locking because D1 is single-writer per database.
// ---------------------------------------------------------------------------
export const counters = sqliteTable("counters", {
  name: text("name").primaryKey(),
  value: integer("value").notNull(),
});

