"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { MemberStatus } from "@/entities/member";

export interface MemberDistributionChartProps {
  counts: Record<MemberStatus, number>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",       // Emerald-500
  expiring_soon: "#f59e0b",// Amber-500
  expired: "#f43f5e",      // Rose-500
  frozen: "#0ea5e9",       // Sky-500
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Lapsed",
  frozen: "Frozen",
};

export function MemberDistributionChart({ counts }: MemberDistributionChartProps) {
  const data = [
    { name: STATUS_LABELS.active, value: counts.active, color: STATUS_COLORS.active },
    { name: STATUS_LABELS.expiring_soon, value: counts.expiring_soon, color: STATUS_COLORS.expiring_soon },
    { name: STATUS_LABELS.expired, value: counts.expired, color: STATUS_COLORS.expired },
  ].filter((item) => item.value > 0);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm">
      {/* Recharts Donut Ring */}
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  const pct = ((Number(item.value) / total) * 100).toFixed(1);
                  return (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-md">
                      <span className="font-bold">{item.name}:</span> {item.value} ({pct}%)
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-zinc-900">{total.toLocaleString()}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total</span>
        </div>
      </div>

      {/* Breakdown Legend Cards */}
      <div className="w-full space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Member Status Distribution</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {data.map((item) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-zinc-700">{item.name}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-zinc-900">{item.value.toLocaleString()}</span>
                  <span className="text-xs font-extrabold text-zinc-500">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
