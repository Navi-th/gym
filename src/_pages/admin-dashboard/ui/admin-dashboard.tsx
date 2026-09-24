import { Suspense } from "react";
import { Skeleton, StatTile } from "@/shared/ui";
import {
  countMembersByStatus,
  getAllMembers,
  selectRenewalsQueue,
} from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { MemberStats } from "@/widgets/member-stats";
import { RenewalsQueue } from "@/widgets/renewals-queue";
import { Users, AlertTriangle, UserX, Activity } from "lucide-react";

async function StatsSection() {
  const members = await getAllMembers();
  const counts = countMembersByStatus(members);

  return (
    <div className="space-y-6">
      {/* 3-Column Micro-Stat Tiles */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatTile
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          value={counts.active.toLocaleString()}
          label="Active Members"
          trend="Active"
        />
        <StatTile
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          value={counts.expiring_soon.toLocaleString()}
          label="Expiring Soon (7 Days)"
        />
        <StatTile
          icon={<UserX className="w-4 h-4 text-rose-600" />}
          value={counts.expired.toLocaleString()}
          label="Lapsed Memberships"
        />
      </div>

      {/* Distribution Chart Card */}
      <MemberStats counts={counts} />
    </div>
  );
}

async function QueueSection() {
  const [members, plans] = await Promise.all([getAllMembers(), getPlans()]);
  const queue = selectRenewalsQueue(members);
  const planNames = planNameById(plans);
  return <RenewalsQueue members={queue} planNameById={planNames} />;
}

export function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#88C400] animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Gym Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-[#C4FF00] text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <Activity className="w-3.5 h-3.5" />
            <span>Live Stream</span>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-[16px]" />
            ))}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-3 pt-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full rounded-[24px]" />
          </div>
        }
      >
        <QueueSection />
      </Suspense>
    </div>
  );
}
