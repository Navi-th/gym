import type { Config } from "drizzle-kit";

/**
 * Migration generation only.
 *
 * We deliberately do NOT configure the `d1-http` driver here, because that
 * requires a Cloudflare API token in the environment just to generate SQL.
 * Instead:
 *
 *   npx drizzle-kit generate                                  -> writes ./drizzle/*.sql
 *   npx wrangler d1 migrations apply gym-app-db --local        -> applies locally
 *   npx wrangler d1 migrations apply gym-app-db --remote       -> applies to prod
 *
 * `migrations_dir: "drizzle"` in wrangler.jsonc points wrangler at this output.
 */
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
