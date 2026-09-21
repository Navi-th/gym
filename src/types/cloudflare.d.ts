/// <reference types="@cloudflare/workers-types" />

/**
 * `@opennextjs/cloudflare` declares a global `CloudflareEnv` interface holding
 * the bindings it knows about (ASSETS, IMAGES, cache overrides...). Our own
 * bindings must be merged in here, otherwise `env.DB` is untyped and
 * `env.DB` usage fails `tsc --strict`.
 *
 * Keep this in sync with the `d1_databases` block in wrangler.jsonc.
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export {};
