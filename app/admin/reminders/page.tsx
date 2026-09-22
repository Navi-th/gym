import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Reminders",
  description: "Send automated WhatsApp payment reminders and renewal notifications to gym members.",
};

export { RemindersPage as default } from "@/_pages/reminders";

// Reads live rows from D1 per request.
export const dynamic = "force-dynamic";

