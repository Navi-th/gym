import Link from "next/link";
import { TBody, TD, TH, THead, TR, Table, TableMessage } from "@/shared/ui";
import {
  formatPhone,
  MemberStatusBadge,
  type MemberWithStatus,
} from "@/entities/member";
import { formatDate, initials } from "@/shared/lib";

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
          <TH>Plan expiry</TH>
          <TH>Status</TH>
          <TH className="text-right">Actions</TH>
        </TR>
      </THead>
      <TBody>
        {members.length === 0 ? (
          <TableMessage colSpan={5}>
            No members match. Try clearing the search, or add a member.
          </TableMessage>
        ) : (
          members.map((member) => (
            <TR key={member.id}>
              <TD>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
                    {initials(member.fullName)}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="truncate font-semibold text-white hover:text-rose-300"
                    >
                      {member.fullName}
                    </Link>
                    <div className="text-[11px] text-slate-500">
                      {member.memberCode}
                    </div>
                  </div>
                </div>
              </TD>
              <TD className="whitespace-nowrap text-slate-300">
                {formatPhone(member.phone)}
              </TD>
              <TD className="whitespace-nowrap text-slate-300">
                {formatDate(member.planEnd)}
              </TD>
              <TD>
                <MemberStatusBadge status={member.status} />
              </TD>
              <TD className="text-right">
                <Link
                  href={`/admin/members/${member.id}`}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  {member.status === "lead" ? "Convert" : "Manage"}
                </Link>
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}
