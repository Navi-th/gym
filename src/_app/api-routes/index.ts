/**
 * Public API of the `_app/api-routes` segment.
 *
 * Route HANDLERS live here; the thin `app/**\/route.ts` files re-export them as
 * the HTTP verbs Next.js expects. Keeping the logic here means `app/` stays a
 * pure routing manifest, and handler logic is importable and testable without
 * going through a URL.
 */
export { getHealth } from "./health";
export { getAdminPing } from "./admin-ping";
