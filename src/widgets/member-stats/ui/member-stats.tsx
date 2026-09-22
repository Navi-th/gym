import dynamic from "next/dynamic";
import { Skeleton } from "@/shared/ui";
import type { MemberStatus } from "@/entities/member";

// Dynamically import Recharts distribution chart component to optimize bundle size
const MemberDistributionChart = dynamic(
  () =>
    import("./member-distribution-chart").then(
      (mod) => mod.MemberDistributionChart
    ),
  {
    loading: () => <Skeleton className="h-56 w-full rounded-2xl" />,
    ssr: false,
  }
);

/**
 * Member lifecycle distribution chart component.
 */
export function MemberStats({ counts }: { counts: Record<MemberStatus, number> }) {
  return <MemberDistributionChart counts={counts} />;
}
