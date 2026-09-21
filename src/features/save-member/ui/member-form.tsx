"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/shared/ui";
import type { Member, MemberStage } from "@/entities/member";
import { submitMember } from "../api/submit-member";

/**
 * Create/edit form for a member.
 *
 * One form serves both modes because every field is shared — separate
 * add/edit features would have to duplicate all of it, since two features may
 * not import each other under FSD.
 *
 * Client component: it owns local form state and posts to the API. All
 * validation authority stays server-side; this only renders what the server
 * rejects, so the rules can never diverge between the two.
 */

type Mode = "create" | "edit";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  gender: "" | "male" | "female" | "other";
  stage: MemberStage;
  whatsappOptIn: boolean;
};

const STAGES: { value: MemberStage; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
];

function initialValues(member?: Member): FormValues {
  return {
    fullName: member?.fullName ?? "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    gender: (member?.gender as FormValues["gender"]) ?? "",
    stage: (member?.stage as MemberStage) ?? "active",
    whatsappOptIn: member?.whatsappOptIn ?? false,
  };
}

export function MemberForm({ mode, member }: { mode: Mode; member?: Member }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => initialValues(member));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);

    const result = await submitMember(mode, member?.id, {
      ...values,
      // Empty strings mean "not provided", not "blank value" — the server
      // validator treats null as absent and "" as present-but-invalid.
      gender: values.gender === "" ? null : values.gender,
      email: values.email.trim() === "" ? null : values.email,
    });

    if (!result.ok) {
      setSaving(false);
      setErrors(result.errors ?? {});
      setFormError(result.message ?? "Please fix the highlighted fields.");
      return;
    }

    router.push("/admin/members");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Aarav Sharma"
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          error={errors.phone}
          hint="Stored as E.164. A 10-digit local number gets +91."
        >
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98765 43210"
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        <Field label="Gender" htmlFor="gender">
          <Select
            id="gender"
            value={values.gender}
            onChange={(e) => set("gender", e.target.value as FormValues["gender"])}
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>

        <Field
          label="Status"
          htmlFor="stage"
          hint="Manual states only. Active vs expired is derived from expiry."
        >
          <Select
            id="stage"
            value={values.stage}
            onChange={(e) => set("stage", e.target.value as MemberStage)}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <label className="flex items-start gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 cursor-pointer hover:bg-zinc-50 transition-colors shadow-sm">
        <input
          type="checkbox"
          checked={values.whatsappOptIn}
          onChange={(e) => set("whatsappOptIn", e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-black rounded shrink-0 cursor-pointer"
        />
        <span className="text-xs sm:text-sm leading-relaxed text-zinc-600">
          <span className="font-extrabold text-zinc-900">WhatsApp consent given.</span> Meta
          requires documented opt-in before business-initiated messages. The timestamp
          of the original consent is preserved across edits.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={saving} showPlus={mode === "create"}>
          {saving ? "Saving…" : mode === "create" ? "Add member" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/members")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
