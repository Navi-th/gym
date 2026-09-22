import { Suspense } from "react";
import { Skeleton } from "@/shared/ui";
import {
  countMembersByStatus,
  getAllMembers,
  selectRenewalsQueue,
} from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { MemberStats } from "@/widgets/member-stats";
import { RenewalsQueue } from "@/widgets/renewals-queue";

async function StatsSection() {
  const members = await getAllMembers();
  const counts = countMembersByStatus(members);
  return <MemberStats counts={counts} />;
}

async function QueueSection() {
  const [members, plans] = await Promise.all([getAllMembers(), getPlans()]);
  const queue = selectRenewalsQueue(members);
  const planNames = planNameById(plans);
  return <RenewalsQueue members={queue} planNameById={planNames} />;
}

export function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
          Live from Cloudflare D1. Membership status is derived from expiry dates.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-y border-zinc-200/90 py-5 sm:py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 pt-3 border-t-2 border-zinc-200 px-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
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
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        }
      >
        <QueueSection />
      </Suspense>
    </div>
  );
}
