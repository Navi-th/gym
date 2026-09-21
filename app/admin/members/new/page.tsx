import { MemberFormPage } from "@/_pages/member-form";

export const dynamic = "force-dynamic";

// A thin adapter rather than a bare re-export. Next passes every page a
// { params, searchParams } object, which does not match this component's own
// props — the adapter keeps Next's page-prop convention out of the FSD layer.
export default function Page() {
  return <MemberFormPage />;
}
