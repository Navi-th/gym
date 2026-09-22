import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Revenue",
  description: "Track payment transactions, total monthly revenue, and record cash/UPI payments.",
};

export { PaymentsPage as default } from "@/_pages/payments";

// Reads live rows from D1 per request.
export const dynamic = "force-dynamic";

