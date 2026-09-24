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
    index("idx_members_dues").on(t.deletedAt, t.stage, t.planEnd),
  ]
);

// ---------------------------------------------------------------------------
// Subscriptions — the member <-> plan join over time
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
    amountCents: integer("amount_cents").notNull(),
    method: text("method", { enum: ["cash", "upi", "card", "bank"] }).notNull(),
    paidAt: text("paid_at").notNull(),
    periodStart: text("period_start"),
    periodEnd: text("period_end"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_payments_member").on(t.memberId),
    index("idx_payments_paid_at").on(t.paidAt),
  ]
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
// ---------------------------------------------------------------------------
export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    ruleId: text("rule_id").references(() => automationRules.id),
    templateKey: text("template_key").notNull(),

    // Idempotency key: "<memberId>:<ruleId|->:<templateKey>"
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

