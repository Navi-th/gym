import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: "Admin | PULSE GYM",
  // The admin panel must never be indexed. Cloudflare Access keeps the public
  // out; this keeps crawlers from advertising the URL.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Root body is already `flex flex-col`, so `flex-1` makes this fill it.
    <div className="flex min-h-screen w-full flex-1 flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
