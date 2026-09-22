import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions Overview",
  description: "View active and expired member subscriptions, plan start/end dates, and renewal status.",
};

export { SubscriptionsPage as default } from "@/_pages/subscriptions";

// Reads live rows from D1 per request.
export const dynamic = "force-dynamic";

