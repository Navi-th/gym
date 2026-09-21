import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Returns a Drizzle client bound to the D1 database.
 *
 * Must be called inside a request scope (route handler, server component or
 * server action) — `getCloudflareContext()` is synchronous only there.
 * For module-scope or build-time use, call
 * `getCloudflareContext({ async: true })` instead.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;

export * from "./schema";
