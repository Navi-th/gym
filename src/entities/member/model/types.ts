import type { members } from "@/shared/db";

/**
 * Member entity types.
 *
 * Derived from the Drizzle table definition rather than hand-written, so the
 * types can never drift from the database schema.
 */
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

/** Lifecycle stage as STORED — manual states only. */
export type { MemberStage, MemberStatus } from "./status";
