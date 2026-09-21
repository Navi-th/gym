"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  LayoutDashboard,
  MessageCircle,
  Package,
  Repeat,
  Users,
  Wallet,
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

  return (
    <aside
      className={cn(
        "shrink-0 border-slate-800 bg-slate-950/80 backdrop-blur",
        // Mobile: a horizontal scrolling strip under the header.
        "w-full border-b",
        // Desktop: a fixed vertical column.
        "lg:w-60 lg:border-b-0 lg:border-r"
      )}
    >
      <div className="flex items-center gap-3 px-5 py-4 lg:py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500">
          <Dumbbell className="h-5 w-5 -rotate-12 text-white" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-black tracking-tight text-white">
            PULSE<span className="text-rose-500">GYM</span>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Admin
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-x-visible lg:pb-0">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-rose-600/15 text-rose-300"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
