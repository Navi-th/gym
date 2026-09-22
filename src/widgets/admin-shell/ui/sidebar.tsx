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
          "shrink-0 border-slate-200/80 bg-white z-30 sticky top-0",
          "w-full border-b lg:static",
          "lg:w-64 lg:border-b-0 lg:border-r lg:min-h-screen"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 lg:py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[#C4FF00] font-black shadow-sm">
              <Dumbbell className="h-5 w-5 -rotate-12 text-[#C4FF00]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold tracking-tight text-slate-900 font-display">
                PULSE<span className="text-[#88C400] font-normal ml-0.5">•</span>
              </div>
            </div>
          </Link>

          {/* Hamburger toggle button for mobile */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 focus:outline-none lg:hidden active:scale-95 cursor-pointer"
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
                  "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all min-h-[44px]",
                  active
                    ? "bg-[#C4FF00] text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-900" : "text-slate-500")} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Right-Side Slide Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white border-l border-slate-200 transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-[#C4FF00] font-black">
              <Dumbbell className="h-4 w-4 -rotate-12 text-[#C4FF00]" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                PULSE<span className="text-[#88C400] font-normal ml-0.5">•</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
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
                  "flex items-center gap-3.5 rounded-full px-4 py-3 text-sm font-semibold transition-all min-h-[44px]",
                  active
                    ? "bg-[#C4FF00] text-slate-900 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-slate-900" : "text-slate-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-400 text-center">
            Pulse Gym Management v1.0
          </div>
        </div>
      </div>
    </>
  );
}
