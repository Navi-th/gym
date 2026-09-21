"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select, Textarea } from "@/shared/ui";
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
  dob: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  stage: MemberStage;
  notes: string;
  whatsappOptIn: boolean;
};

const STAGES: { value: MemberStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "churned", label: "Churned" },
];

function initialValues(member?: Member): FormValues {
  return {
    fullName: member?.fullName ?? "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    gender: (member?.gender as FormValues["gender"]) ?? "",
    dob: member?.dob ?? "",
    emergencyContactName: member?.emergencyContactName ?? "",
    emergencyContactPhone: member?.emergencyContactPhone ?? "",
    stage: (member?.stage as MemberStage) ?? "lead",
    notes: member?.notes ?? "",
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
      dob: values.dob.trim() === "" ? null : values.dob,
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
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
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

        <Field label="Date of birth" htmlFor="dob" error={errors.dob}>
          <Input
            id="dob"
            type="date"
            value={values.dob}
            onChange={(e) => set("dob", e.target.value)}
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

        <Field label="Emergency contact" htmlFor="emergencyContactName">
          <Input
            id="emergencyContactName"
            value={values.emergencyContactName}
            onChange={(e) => set("emergencyContactName", e.target.value)}
          />
        </Field>

        <Field
          label="Emergency contact phone"
          htmlFor="emergencyContactPhone"
          error={errors.emergencyContactPhone}
        >
          <Input
            id="emergencyContactPhone"
            value={values.emergencyContactPhone}
            onChange={(e) => set("emergencyContactPhone", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>

      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <input
          type="checkbox"
          checked={values.whatsappOptIn}
          onChange={(e) => set("whatsappOptIn", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-rose-600"
        />
        <span className="text-xs leading-relaxed text-slate-300">
          <span className="font-bold text-white">WhatsApp consent given.</span> Meta
          requires documented opt-in before business-initiated messages. The timestamp
          of the original consent is preserved across edits.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving}>
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
