import { AlertTriangle, Users, UserX } from "lucide-react";
import { Card, CardContent } from "@/shared/ui";
import type { MemberStatus } from "@/entities/member";

/**
 * KPI tiles for the member lifecycle.
 *
 * Presentational: it receives already-derived counts, so it holds no opinion
 * about how status is worked out. That logic lives in the member entity.
 */
export function MemberStats({ counts }: { counts: Record<MemberStatus, number> }) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const tiles = [
    { label: "Total members", value: total, icon: Users, tone: "text-zinc-900", iconTone: "text-zinc-700" },
    { label: "Active", value: counts.active, icon: Users, tone: "text-zinc-900", iconTone: "text-emerald-600" },
    {
      label: "Expiring soon",
      value: counts.expiring_soon,
      icon: AlertTriangle,
      tone: "text-zinc-900",
      iconTone: "text-amber-600",
    },
    { label: "Lapsed", value: counts.expired, icon: UserX, tone: "text-zinc-900", iconTone: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card key={tile.label} className="border-zinc-200/90 bg-white shadow-sm">
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 truncate pr-1">
                  {tile.label}
                </span>
                <Icon className={`h-4 w-4 shrink-0 ${tile.iconTone}`} />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{tile.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
