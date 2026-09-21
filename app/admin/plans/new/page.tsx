import { PlanFormPage } from "@/_pages/plan-form";

export const dynamic = "force-dynamic";

// Thin adapter: Next passes { params, searchParams } to every page, which does
// not match this component's own props.
export default function Page() {
  return <PlanFormPage />;
}
