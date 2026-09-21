import type { payments } from "@/shared/db";

/** Derived from the Drizzle table, so it cannot drift from the schema. */
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type PaymentMethod = Payment["method"];
