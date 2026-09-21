import { PlanFormPage } from "@/_pages/plan-form";

export const dynamic = "force-dynamic";

// Adapter: unwraps the route param into a plain prop for the FSD page.
export default function Page({ params }: { params: { id: string } }) {
  return <PlanFormPage planId={params.id} />;
}
