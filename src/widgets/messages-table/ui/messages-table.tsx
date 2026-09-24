import {
  Card,
  CardContent,
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
                      <div className="truncate font-bold text-zinc-900">
                        {message.memberName}
                      </div>
                      <div className="text-[11px] font-semibold text-zinc-500">{message.toPhone}</div>
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-zinc-600 font-medium">
                    {message.templateKey}
                  </TD>
                  <TD className="max-w-md text-xs text-zinc-700">
                    <span className="line-clamp-2">{message.renderedBody}</span>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-zinc-600 font-medium">
                    {formatDate(message.sentAt ?? message.createdAt)}
                  </TD>
                  <TD>
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-black ${
                        message.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : message.status === "failed"
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : "bg-zinc-100 text-zinc-600 border-zinc-300"
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
