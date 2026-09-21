import { MemberFormPage } from "@/_pages/member-form";

export const dynamic = "force-dynamic";

// Adapter: unwraps the route param into a plain prop for the FSD page.
export default function Page({ params }: { params: { id: string } }) {
  return <MemberFormPage memberId={params.id} />;
}
