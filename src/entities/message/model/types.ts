import type { messages } from "@/shared/db";

/** Derived from the Drizzle table, so it cannot drift from the schema. */
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageStatus = Message["status"];
export type MessageChannel = Message["channel"];
