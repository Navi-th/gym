/**
 * Public API of the `_app/api-routes` segment.
 *
 * Route HANDLERS live here. The thin route.ts files under app/ re-export them
 * as the HTTP verbs Next.js expects. Keeping the logic here means app/ stays a
 * pure routing manifest, and handler logic is importable and testable without
 * going through a URL.
 */
export { getHealth } from "./health";
export { getAdminPing } from "./admin-ping";
export { createMemberHandler, listMembersHandler } from "./members";
export {
  archiveMemberHandler,
  getMemberHandler,
  updateMemberHandler,
} from "./member-by-id";
export { assignPlanHandler, listSubscriptionsHandler } from "./subscriptions";
export {
  getSubscriptionHandler,
  updateSubscriptionHandler,
} from "./subscription-by-id";
export { createPlanHandler, listPlansHandler } from "./plans";
export { getPlanHandler, updatePlanHandler } from "./plan-by-id";
