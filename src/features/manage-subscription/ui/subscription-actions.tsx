"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/shared/ui";
import { submitSubscriptionAction } from "../api/submit-action";

/**
 * Renew and freeze for one subscription.
 *
 * One component for both because they are the same operation from the
 * database's point of view — push the end date out — and differ only in
 * intent. Splitting them into separate features would duplicate the request
 * plumbing and the error handling for no gain.
 *
 * Freezing asks for a duration because it is not a fixed length; renewing does
 * not, because the plan already knows its own length.
 */
export function SubscriptionActions({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFreeze, setShowFreeze] = useState(false);
  const [freezeDays, setFreezeDays] = useState("7");

  async function run(label: string, input: Parameters<typeof submitSubscriptionAction>[1]) {
    setBusy(label);
    setError(null);

    const result = await submitSubscriptionAction(subscriptionId, input);

    if (!result.ok) {
      setBusy(null);
      const fieldError = result.errors ? Object.values(result.errors)[0] : undefined;
      setError(fieldError ?? result.message ?? "Something went wrong.");
      return;
    }

    setBusy(null);
    setShowFreeze(false);
    router.refresh();
  }

  const days = Number(freezeDays);
  const daysValid = Number.isInteger(days) && days > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        onClick={() => run("renew", { action: "renew" })}
        disabled={busy !== null}
      >
        {busy === "renew" ? "Renewing…" : "Renew"}
      </Button>

      {showFreeze ? (
        <>
          <Input
            type="number"
            min={1}
            value={freezeDays}
            onChange={(e) => setFreezeDays(e.target.value)}
            className="h-8 w-20 px-2 py-0 text-xs"
            aria-label="Days to freeze"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => run("freeze", { action: "freeze", freezeDays: days })}
            disabled={busy !== null || !daysValid}
          >
            {busy === "freeze" ? "Freezing…" : "Confirm freeze"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowFreeze(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setShowFreeze(true)}>
          Freeze
        </Button>
      )}

      {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
    </div>
  );
}
