"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  Repeat,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only match this path exactly — otherwise /admin matches every child. */
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: Package },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/reminders", label: "Reminders", icon: MessageCircle },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile nav automatically on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <aside
        className={cn(
          "shrink-0 border-zinc-200 bg-white shadow-sm z-30 sticky top-0",
          // Mobile layout
          "w-full border-b lg:static",
          // Desktop layout: fixed sidebar column
          "lg:w-64 lg:border-b-0 lg:border-r lg:min-h-screen lg:shadow-none"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 lg:py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-sm shadow-black/20">
              <Dumbbell className="h-5 w-5 -rotate-12 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-black tracking-wider text-zinc-900">
                PULSE<span className="text-zinc-500 font-normal ml-0.5">GYM</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Admin Console
              </div>
            </div>
          </Link>

          {/* Hamburger toggle button for mobile */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition-all hover:bg-zinc-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-black lg:hidden active:scale-95 cursor-pointer"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:flex-col lg:gap-1.5 lg:px-4 lg:pb-6">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all min-h-[44px]",
                  active
                    ? "bg-black text-white shadow-md shadow-black/10"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-zinc-500")} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Backdrop Overlay with Fade Animation */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Right-Side Slide Drawer with Smooth Transition Animation */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white border-l border-zinc-200 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-black shadow-sm">
              <Dumbbell className="h-4 w-4 -rotate-12 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-zinc-900 tracking-wider">
                PULSE<span className="text-zinc-400 font-normal ml-0.5">GYM</span>
              </div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                Navigation
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all min-h-[44px]",
                  active
                    ? "bg-black text-white shadow-md shadow-black/10"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-black"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-zinc-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="text-[11px] font-medium text-zinc-400 text-center">
            Pulse Gym Management v1.0
          </div>
        </div>
      </div>
    </>
  );
}
