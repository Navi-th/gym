/**
 * Public API of the `payment` entity slice.
 *
 * Queries arrive with module 6 (payments) — the slice exists now so the layer
 * boundary is in place from the start.
 */
export type { NewPayment, Payment, PaymentMethod } from "./model/types";
