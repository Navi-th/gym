import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, subscriptions as subscriptionsTable } from "@/shared/db";
import type { Subscription } from "../model/types";

export const getSubscriptionById = cache(async function getSubscriptionById(
  id: string
): Promise<Subscription | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.id, id))
    .limit(1);

  return rows[0] ?? null;
});

