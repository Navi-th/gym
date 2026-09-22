import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members Directory",
  description: "View and filter gym members by active status, plan expiry date, and emergency contact details.",
};

export { MembersPage as default } from "@/_pages/members";

// Reads live rows from D1 per request.
export const dynamic = "force-dynamic";

