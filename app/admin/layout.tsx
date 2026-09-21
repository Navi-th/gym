import type { Metadata } from "next";
import { AdminShell } from "@/widgets/admin-shell";
import { APP_NAME } from "@/shared/config";

export const metadata: Metadata = {
  title: `Admin | ${APP_NAME}`,
  // The admin panel must never be indexed. Cloudflare Access keeps the public
  // out; this stops crawlers advertising the URL.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
