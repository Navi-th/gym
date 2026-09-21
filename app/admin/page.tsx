export { AdminDashboardPage as default } from "@/_pages/admin-dashboard";

// Route segment config MUST be declared in the route file itself: Next.js reads
// it statically at build time. It cannot live in the FSD pages layer.
//
// This page reads live rows from D1 per request. Without force-dynamic Next
// would try to prerender it at build time, where no DB binding exists.
export const dynamic = "force-dynamic";
