import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableMessage,
} from "@/shared/ui";
import type { MessageWithMember } from "@/entities/message";
import { formatDate } from "@/shared/lib";

/** The outbound ledger. Read-only — sent messages are evidence, not draft. */
export function MessagesTable({ messages }: { messages: MessageWithMember[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent messages</CardTitle>
        <CardDescription>
          The exact wording that went out is stored, so a dispute has an answer.
          A duplicate is refused by the database, not by a check somebody has to remember.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <TR>
              <TH>Member</TH>
              <TH>Template</TH>
              <TH>Message</TH>
              <TH>Sent</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {messages.length === 0 ? (
              <TableMessage colSpan={5}>No messages sent yet.</TableMessage>
            ) : (
              messages.map((message) => (
                <TR key={message.id}>
                  <TD>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">
                        {message.memberName}
                      </div>
                      <div className="text-[11px] text-slate-500">{message.toPhone}</div>
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-slate-400">
                    {message.templateKey}
                  </TD>
                  <TD className="max-w-md text-xs text-slate-300">
                    <span className="line-clamp-2">{message.renderedBody}</span>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-slate-400">
                    {formatDate(message.sentAt ?? message.createdAt)}
                  </TD>
                  <TD>
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        message.status === "sent"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : message.status === "failed"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-slate-700/30 text-slate-400 border-slate-600/40"
                      }`}
                    >
                      {message.status}
                    </span>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
