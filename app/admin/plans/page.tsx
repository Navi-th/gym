import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "View and configure gym membership plans, pricing tiers, duration, and descriptions.",
};

export { PlansPage as default } from "@/_pages/plans";

// Reads live rows from D1 per request.
export const dynamic = "force-dynamic";

