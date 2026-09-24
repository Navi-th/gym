"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { submitReminder } from "../api/submit-reminder";

/** Everything needed to send one reminder, prepared on the server. */
export type ReminderTarget = {
  memberId: string;
  memberName: string;
  templateKey: string;
  ruleId: string | null;
  /** The membership end date this message is about — part of the dedupe key. */
  period: string | null;
  /** Finished `wa.me` link, built server-side from the rendered body. */
  link: string;
  whatsappOptIn: boolean;
};

/**
 * Send / Skip for one queued reminder.
 *
 * Send opens the prepared link FIRST and records the outcome only once the
 * browser has actually opened it. A blocked popup therefore records nothing and
 * the member stays in the queue, rather than leaving a "sent" row behind for a
 * message that never left the machine.
 *
 * There is still an honest limit: WhatsApp gives no signal that the human
 * pressed send inside the app, so `sent` means "handed to WhatsApp", not
 * "delivered". That is precisely the gap a provider webhook would close.
 */
export function SendReminderActions({
  target,
  onHandled,
}: {
  target: ReminderTarget;
  onHandled: () => void;
}) {
  const [busy, setBusy] = useState<"sent" | "skipped" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function commit(status: "sent" | "skipped") {
    setBusy(status);
    setError(null);

    const result = await submitReminder({
      memberId: target.memberId,
      templateKey: target.templateKey,
      ruleId: target.ruleId,
      period: target.period,
      status,
    });

    setBusy(null);

    if (!result.ok) {
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Could not record that.");
      return;
    }

    onHandled();
  }

  async function send() {
    setError(null);

    const opened = window.open(target.link, "_blank", "noopener,noreferrer");
    if (!opened) {
      setError(
        "Your browser blocked the WhatsApp tab, so nothing was recorded. Allow pop-ups and try again."
      );
      return;
    }

    await commit("sent");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={send}
          loading={busy === "sent"}
          disabled={busy !== null || !target.whatsappOptIn}
        >
          Send on WhatsApp
        </Button>
        <Button
          variant="secondary"
          onClick={() => commit("skipped")}
          loading={busy === "skipped"}
          disabled={busy !== null}
        >
          Skip
        </Button>
      </div>

      {!target.whatsappOptIn && (
        <p className="text-[11px] font-semibold text-amber-700">
          {target.memberName} has not given WhatsApp consent, so sending is blocked. Record
          consent on their profile, or skip.
        </p>
      )}

      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
