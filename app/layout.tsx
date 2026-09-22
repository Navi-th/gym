import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "PULSE GYM — Admin & Management Console",
    template: "%s | PULSE GYM",
  },
  description: "Gym management system for member registration, active subscriptions, revenue tracking, and automated WhatsApp payment reminders.",
  keywords: ["gym management", "fitness center software", "subscriptions", "members", "payments"],
  authors: [{ name: "PULSE GYM" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "PULSE GYM — Admin Console",
    description: "Gym management, membership subscriptions, payments, and WhatsApp reminders.",
    type: "website",
    locale: "en_US",
    siteName: "PULSE GYM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased bg-slate-50 text-zinc-900 min-h-screen flex flex-col selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}

