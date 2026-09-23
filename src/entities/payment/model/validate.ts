import { MAX_MONEY_CENTS } from "@/shared/config";

export type PaymentMethod = "cash" | "upi" | "card" | "bank";

export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "upi", "card", "bank"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank transfer",
};

export type PaymentInput = {
  memberId: string;
  amountCents: number;
  method: PaymentMethod;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
};

export type PaymentValidationResult =
  | { ok: true; value: PaymentInput }
  | { ok: false; errors: Record<string, string> };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function validatePaymentInput(
  raw: Partial<PaymentInput> & { amountCents?: number }
): PaymentValidationResult {
  const errors: Record<string, string> = {};

  const memberId = clean(raw.memberId);
  if (!memberId) errors.memberId = "A member is required.";

  const amountCents = raw.amountCents;
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    errors.amountCents = "Amount is required.";
  } else if (!Number.isInteger(amountCents)) {
    errors.amountCents = "Amount must be a whole number of minor units (cents).";
  } else if (amountCents <= 0) {
    errors.amountCents = "Amount must be greater than zero.";
  } else if (amountCents > MAX_MONEY_CENTS) {
    errors.amountCents = "Amount looks too large — check for a misplaced decimal point.";
  }

  const method = raw.method;
  if (!method || !PAYMENT_METHODS.includes(method)) {
    errors.method = `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}.`;
  }

  const paidAt = clean(raw.paidAt) ?? new Date().toISOString().slice(0, 10);
  if (!ISO_DATE.test(paidAt)) {
    errors.paidAt = "Payment date must be YYYY-MM-DD.";
  }

  for (const [field, value] of [
    ["periodStart", clean(raw.periodStart)],
    ["periodEnd", clean(raw.periodEnd)],
  ] as const) {
    if (value && !ISO_DATE.test(value)) {
      errors[field] = "Must be YYYY-MM-DD.";
    }
  }

  const periodStart = clean(raw.periodStart);
  const periodEnd = clean(raw.periodEnd);
  if (periodStart && periodEnd && periodEnd < periodStart) {
    errors.periodEnd = "The period cannot end before it starts.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      memberId: memberId as string,
      amountCents: amountCents as number,
      method: method as PaymentMethod,
      paidAt,
      periodStart,
      periodEnd,
    },
  };
}
