import { AlertTriangle, Users, UserX } from "lucide-react";
import type { MemberStatus } from "@/entities/member";

/**
 * Open-plan KPI Metric Strip for the member lifecycle (Hallmark Anti-Card).
 *
 * Presentational: renders clean metric blocks with hairline top accents,
 * large typographic numbers, and zero boxed card containers.
 */
export function MemberStats({ counts }: { counts: Record<MemberStatus, number> }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const tiles = [
    { label: "Total members", value: total, icon: Users, accent: "border-black", tone: "text-zinc-900", iconTone: "text-zinc-700" },
    { label: "Active", value: counts.active, icon: Users, accent: "border-emerald-500", tone: "text-zinc-900", iconTone: "text-emerald-600" },
    {
      label: "Expiring soon",
      value: counts.expiring_soon,
      icon: AlertTriangle,
      accent: "border-amber-500",
      tone: "text-zinc-900",
      iconTone: "text-amber-600",
    },
    { label: "Lapsed", value: counts.expired, icon: UserX, accent: "border-rose-500", tone: "text-zinc-900", iconTone: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-y border-zinc-200/90 py-5 sm:py-6">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div key={tile.label} className={`flex flex-col justify-between pt-3 border-t-2 ${tile.accent} px-1`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 truncate">
                {tile.label}
              </span>
              <Icon className={`h-4 w-4 shrink-0 ${tile.iconTone}`} />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              {tile.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
