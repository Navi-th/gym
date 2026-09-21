/**
 * Admin dashboard page.
 *
 * This is the page's job in FSD: fetch what it needs, then compose widgets.
 * It renders no chart, table or tile itself — all of that lives in `widgets`,
 * which keeps this file readable and the widgets independently testable.
 */
import {
  countMembersByStatus,
  getMembers,
  selectRenewalsQueue,
} from "@/entities/member";
import { getPlans, planNameById } from "@/entities/plan";
import { MemberStats } from "@/widgets/member-stats";
import { RenewalsQueue } from "@/widgets/renewals-queue";

export async function AdminDashboardPage() {
  const [members, plans] = await Promise.all([getMembers(), getPlans()]);

  const counts = countMembersByStatus(members);
  const queue = selectRenewalsQueue(members);
  const planNames = planNameById(plans);

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed">
          Live from Cloudflare D1. Membership status is derived from expiry dates.
        </p>
      </header>

      <MemberStats counts={counts} />

      <RenewalsQueue members={queue} planNameById={planNames} />
    </div>
  );
}
