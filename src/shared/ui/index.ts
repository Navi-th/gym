/**
 * Public API of the `shared/ui` segment.
 *
 * These are generic, domain-free primitives. Anything that knows about a
 * business concept (a Member, a Plan) belongs in the `ui` segment of the
 * relevant entity slice, not here.
 */
export * from "./button";
export * from "./card";
export * from "./input";
export * from "./skeleton";
export * from "./table";
