"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";

/**
 * Archives (soft-deletes) a member.
 *
 * Confirms first, because archiving is the kind of click people regret. The
 * wording deliberately says what is NOT lost — staff hesitate otherwise, and a
 * hesitant front desk keeps dead records instead.
 */
export function ArchiveMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    const confirmed = window.confirm(
      `Archive ${memberName}?\n\nTheir payment and subscription history is kept, and their phone number is freed up for reuse.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    const response = await fetch(`/admin/api/members/${memberId}`, { method: "DELETE" });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    setBusy(false);

    if (!response.ok || !data?.ok) {
      setError(data?.error ?? `Failed with status ${response.status}.`);
      return;
    }

    router.push("/admin/members");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="danger" onClick={handleArchive} disabled={busy}>
        {busy ? "Archiving…" : "Archive member"}
      </Button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
