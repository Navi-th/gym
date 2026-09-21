/**
 * Public API of the `shared/db` segment.
 *
 * The Drizzle table definitions deliberately live in ONE file rather than being
 * split per entity. The tables reference each other (members -> plans,
 * messages -> subscriptions, ...), so splitting them by entity would create
 * circular imports between slices for no real gain. Entities own their
 * *queries*; this segment owns the schema itself.
 */
export { getDb, type Db } from "./client";
export * from "./schema";
