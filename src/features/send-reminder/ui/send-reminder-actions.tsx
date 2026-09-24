"use client";

import { useState } from "react";
import { Loader2, MessageCircle, X } from "lucide-react";
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
 * Designed to be compact & fully mobile-friendly. On mobile devices, shows
 * a WhatsApp icon + "Send" button; on desktop shows "Send on WhatsApp".
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={send}
          disabled={busy !== null || !target.whatsappOptIn}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#C4FF00] hover:bg-[#b2eb00] text-slate-900 font-extrabold text-xs h-8 sm:h-9 px-3 sm:px-4 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
          title={`Send WhatsApp reminder to ${target.memberName}`}
        >
          {busy === "sent" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-slate-900" />
          ) : (
            <MessageCircle className="w-3.5 h-3.5 shrink-0 text-slate-900 fill-slate-900/10" />
          )}
          <span className="inline sm:hidden">Send</span>
          <span className="hidden sm:inline">Send on WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => commit("skipped")}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
          title="Skip this member"
        >
          {busy === "skipped" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="inline sm:hidden">Skip</span>
          <span className="hidden sm:inline">Skip</span>
        </button>
      </div>

      {!target.whatsappOptIn && (
        <p className="text-[10px] sm:text-[11px] font-semibold text-amber-700 text-right max-w-[180px] sm:max-w-none ml-auto">
          WhatsApp opt-in required.
        </p>
      )}

      {error && (
        <p className="text-[10px] sm:text-[11px] font-semibold text-rose-600 text-right max-w-[180px] sm:max-w-none ml-auto">
          {error}
        </p>
      )}
    </div>
  );
}

