import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { getDb, messageTemplates as templatesTable } from "@/shared/db";

export type MessageTemplate = typeof templatesTable.$inferSelect;

export const getMessageTemplates = cache(async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const db = getDb();
  return db.select().from(templatesTable).orderBy(desc(templatesTable.createdAt));
});

export const getMessageTemplateByKey = cache(async function getMessageTemplateByKey(
  key: string
): Promise<MessageTemplate | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.key, key))
    .limit(1);

  return rows[0] ?? null;
});

