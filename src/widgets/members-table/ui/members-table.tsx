import Link from "next/link";
import { TBody, TD, TH, THead, TR, Table, TableMessage } from "@/shared/ui";
import {
  formatPhone,
  MemberStatusBadge,
  type MemberWithStatus,
} from "@/entities/member";
import { formatDate, formatRelativeDays } from "@/shared/lib";

/**
 * Member directory table.
 *
 * Presentational and server-rendered: filtering happens through the URL, so
 * this needs no client JavaScript at all.
 */
export function MembersTable({ members }: { members: MemberWithStatus[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Member</TH>
          <TH>Phone</TH>
          <TH>Plan</TH>
          <TH>Ends</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {members.length === 0 ? (
          <TableMessage colSpan={6}>
            No members match. Try clearing the search, or add a member.
          </TableMessage>
        ) : (
          members.map((member) => (
            <TR key={member.id}>
              <TD>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="font-bold text-zinc-900 hover:text-black transition-colors"
                >
                  {member.fullName}
                </Link>
              </TD>
              <TD className="whitespace-nowrap text-zinc-700">
                {formatPhone(member.phone)}
              </TD>
              <TD className="whitespace-nowrap text-zinc-700 font-medium">
                {member.planName ?? "—"}
              </TD>
              <TD className="whitespace-nowrap">
                <div className="text-zinc-800 font-medium">
                  {formatDate(member.planEnd)}
                </div>
                {member.planEnd && member.daysLeft != null && (
                  <div className="text-[11px] font-semibold text-zinc-500">
                    {formatRelativeDays(member.daysLeft)}
                  </div>
                )}
              </TD>
              <TD>
                <MemberStatusBadge status={member.status} />
              </TD>
              <TD className="text-right">
                <Link
                  href={`/admin/members/${member.id}`}
                  className="text-xs font-black text-black hover:underline underline-offset-2"
                >
                  Manage
                </Link>
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}
