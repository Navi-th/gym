import { normalisePhone } from "./phone";
import type { MemberStage } from "./status";

/**
 * Member input validation.
 *
 * Hand-written rather than zod: this is a handful of fields, and adding a
 * schema library is a decision worth making deliberately rather than
 * sneaking in with a form. If validation grows past this, zod is the natural
 * upgrade — the shape below is already zod-compatible.
 *
 * Returns a plain result object instead of throwing, so callers can render
 * field-level errors.
 */

export type MemberInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  stage?: MemberStage;
  notes?: string | null;
  whatsappOptIn?: boolean;
};

/** Normalised, database-ready values. */
export type ValidMemberInput = Omit<MemberInput, "phone" | "emergencyContactPhone"> & {
  phone: string;
  emergencyContactPhone: string | null;
};

export type ValidationResult =
  | { ok: true; value: ValidMemberInput }
  | { ok: false; errors: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STAGES: MemberStage[] = ["lead", "active", "frozen", "churned"];

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Validates and normalises raw input (typically straight off a form).
 *
 * Collects ALL errors rather than stopping at the first, so a user fixing a
 * form does not discover problems one submit at a time.
 */
export function validateMemberInput(raw: Partial<MemberInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const fullName = clean(raw.fullName);
  if (!fullName) {
    errors.fullName = "Name is required.";
  } else if (fullName.length < 2) {
    errors.fullName = "Name must be at least 2 characters.";
  } else if (fullName.length > 120) {
    errors.fullName = "Name must be under 120 characters.";
  }

  const phone = normalisePhone(raw.phone ?? "");
  if (!raw.phone || !clean(raw.phone)) {
    errors.phone = "Phone is required.";
  } else if (!phone) {
    errors.phone = "Not a valid phone number. Use +<countrycode><number> or a 10-digit local number.";
  }

  const email = clean(raw.email);
  if (email && !EMAIL_RE.test(email)) {
    errors.email = "Not a valid email address.";
  }

  const dob = clean(raw.dob);
  if (dob && !ISO_DATE_RE.test(dob)) {
    errors.dob = "Date of birth must be YYYY-MM-DD.";
  }

  const emergencyContactPhoneRaw = clean(raw.emergencyContactPhone);
  const emergencyContactPhone = emergencyContactPhoneRaw
    ? normalisePhone(emergencyContactPhoneRaw)
    : null;
  if (emergencyContactPhoneRaw && !emergencyContactPhone) {
    errors.emergencyContactPhone = "Not a valid phone number.";
  }

  const stage = raw.stage ?? "lead";
  if (!STAGES.includes(stage)) {
    errors.stage = `Stage must be one of: ${STAGES.join(", ")}.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      fullName: fullName as string,
      phone: phone as string,
      email,
      gender: raw.gender ?? null,
      dob,
      emergencyContactName: clean(raw.emergencyContactName),
      emergencyContactPhone,
      stage,
      notes: clean(raw.notes),
      whatsappOptIn: Boolean(raw.whatsappOptIn),
    },
  };
}
