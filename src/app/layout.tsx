import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PULSE GYM | Next-Gen Fitness & High-Performance Training",
  description: "Experience elite fitness coaching, state-of-the-art strength zones, dynamic group classes, and AI-driven training plans on Cloudflare Workers.",
  keywords: ["gym", "fitness", "workout", "personal trainer", "bodybuilding", "pulse gym"],
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
