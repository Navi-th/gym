import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PULSE GYM Admin",
  description: "Membership, subscriptions, payments and WhatsApp reminders.",
  // The whole application is the admin panel, so none of it belongs in a search
  // index. Cloudflare Access keeps people out; this keeps crawlers from
  // advertising the URL in the first place.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#090a0f] text-slate-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
