import { AlertTriangle, UserPlus, Users, UserX } from "lucide-react";
import { getDb } from "@/lib/db";
import { members as membersTable, plans as plansTable } from "@/lib/db/schema";
import {
  deriveMemberStatus,
  daysUntilExpiry,
  type MemberStatus,
} from "@/lib/members/status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusBadge,
} from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table, TableMessage } from "@/components/ui/table";
import { formatDate, formatMoneyCompact, formatRelativeDays, initials } from "@/lib/format";

// This page reads live rows from D1 on every request. Without force-dynamic,
// Next would try to prerender it at build time, where no DB binding exists.
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = getDb();

  const [memberRows, planRows] = await Promise.all([
    db.select().from(membersTable),
    db.select().from(plansTable),
  ]);

  const planNameById = new Map(planRows.map((p) => [p.id, p.name]));

  // Derive the status admins should actually see. `stage` alone would report
  // "active" for a member whose plan lapsed last month.
  const live = memberRows
    .filter((m) => !m.deletedAt)
    .map((m) => ({
      ...m,
      status: deriveMemberStatus({ stage: m.stage, planEnd: m.planEnd }),
      daysLeft: m.planEnd ? daysUntilExpiry(m.planEnd) : null,
    }));

  const countBy = (status: MemberStatus) =>
    live.filter((m) => m.status === status).length;

  const total = live.length;
  const activeCount = countBy("active");
  const expiringCount = countBy("expiring_soon");
  const expiredCount = countBy("expired");
  const leadCount = countBy("lead");

  // Anyone needing action, most urgent first.
  const queue = live
    .filter((m) => m.status === "expiring_soon" || m.status === "expired")
    .sort((a, b) => (a.planEnd ?? "").localeCompare(b.planEnd ?? ""));

  const stats = [
    { label: "Total members", value: total, icon: Users, tone: "text-slate-300" },
    { label: "Active", value: activeCount, icon: Users, tone: "text-emerald-300" },
    { label: "Expiring soon", value: expiringCount, icon: AlertTriangle, tone: "text-amber-300" },
    { label: "Lapsed", value: expiredCount, icon: UserX, tone: "text-rose-300" },
    { label: "Leads", value: leadCount, icon: UserPlus, tone: "text-slate-400" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live from Cloudflare D1. Membership status is derived from expiry dates,
          not stored.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {s.label}
                  </span>
                  <Icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                <div className={`mt-2 text-3xl font-black ${s.tone}`}>{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plans on offer</CardTitle>
            <CardDescription>
              Price shown is the amount charged per billing period.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-0">
              <THead>
                <TR>
                  <TH>Plan</TH>
                  <TH>Billing</TH>
                  <TH className="text-right">Price</TH>
                </TR>
              </THead>
              <TBody>
                {planRows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-semibold text-white">{p.name}</TD>
                    <TD className="capitalize text-slate-400">{p.billingPeriod}</TD>
                    <TD className="text-right font-bold text-rose-300">
                      {formatMoneyCompact(p.priceCents)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renewals queue</CardTitle>
            <CardDescription>
              Expiring within 7 days, plus everything already lapsed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Member</TH>
                  <TH>Plan</TH>
                  <TH>Expiry</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {queue.length === 0 ? (
                  <TableMessage colSpan={4}>Nothing needs attention.</TableMessage>
                ) : (
                  queue.map((m) => (
                    <TR key={m.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                            {initials(m.fullName)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">
                              {m.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.memberCode}
                            </div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-slate-300">
                        {m.planId ? planNameById.get(m.planId) ?? "—" : "—"}
                      </TD>
                      <TD>
                        <div className="text-slate-300">{formatDate(m.planEnd)}</div>
                        {m.daysLeft !== null && (
                          <div className="text-[11px] text-slate-500">
                            {formatRelativeDays(m.daysLeft)}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge status={m.status} />
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
