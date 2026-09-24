/**
 * Public API of the `payment` entity slice.
 *
 * Records money that has already been taken. There is no payment gateway here
 * by design — staff record what happened, and the row is an immutable audit
 * entry.
 */

// --- data access -----------------------------------------------------------
export { recordPayment } from "./api/record-payment";
export {
  getPayments,
  getAllPayments,
  type PaymentFilter,
  type PaymentWithMember,
} from "./api/get-payments";
export { getMemberPayments } from "./api/get-member-payments";
export {
  getRevenueTotals,
  getRevenueTotalsCached,
  type RevenueTotals,
} from "./api/get-revenue-totals";

// --- model -----------------------------------------------------------------
export {
  daysOverdue,
  isOverdue,
  selectDues,
  type HasPlanEnd,
} from "./model/dues";
export {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  validatePaymentInput,
  type PaymentInput,
  type PaymentMethod,
  type PaymentValidationResult,
} from "./model/validate";
export type { NewPayment, Payment } from "./model/types";
