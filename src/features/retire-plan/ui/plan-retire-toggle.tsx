"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";

/**
 * Retires or restores a plan.
 *
 * Retiring is not deleting, and the wording says so. An admin who thinks this
 * removes the plan is an admin who will not press it, and will leave dead
 * plans cluttering the assign dropdown instead.
 */
export function PlanRetireToggle({
  planId,
  planName,
  isActive,
}: {
  planId: string;
  planName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (isActive) {
      const ok = window.confirm(
        `Retire ${planName}?\n\nIt will disappear from new assignments. Every existing subscription keeps the dates and price it was sold at.`
      );
      if (!ok) return;
    }

    setBusy(true);
    setError(null);

    const response = await fetch(`/admin/api/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    setBusy(false);

    if (!response.ok || !data?.ok) {
      setError(data?.error ?? `Failed with status ${response.status}.`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant={isActive ? "secondary" : "primary"} onClick={toggle} disabled={busy}>
        {busy ? "…" : isActive ? "Retire" : "Restore"}
      </Button>
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </div>
  );
}
