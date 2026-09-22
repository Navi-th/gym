import type { Metadata } from "next";
import { AdminShell } from "@/widgets/admin-shell";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage members, active plans, revenue payments, and send WhatsApp renewal reminders.",
  robots: { index: true, follow: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}


