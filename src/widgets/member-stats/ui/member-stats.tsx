import { AlertTriangle, UserPlus, Users, UserX } from "lucide-react";
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
    { label: "Total members", value: total, icon: Users, tone: "text-slate-300" },
    { label: "Active", value: counts.active, icon: Users, tone: "text-emerald-300" },
    {
      label: "Expiring soon",
      value: counts.expiring_soon,
      icon: AlertTriangle,
      tone: "text-amber-300",
    },
    { label: "Lapsed", value: counts.expired, icon: UserX, tone: "text-rose-300" },
    { label: "Leads", value: counts.lead, icon: UserPlus, tone: "text-slate-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card key={tile.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {tile.label}
                </span>
                <Icon className={`h-4 w-4 ${tile.tone}`} />
              </div>
              <div className={`mt-2 text-3xl font-black ${tile.tone}`}>{tile.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
