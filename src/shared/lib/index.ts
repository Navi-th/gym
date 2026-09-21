/**
 * Public API of the `shared/lib` segment.
 *
 * Import from `@/shared/lib` — never from the individual files — so the
 * segment can be reorganised without touching every consumer.
 */
export { cn } from "./cn";
export * from "./date";
export * from "./errors";
export * from "./format";
export * from "./id";
