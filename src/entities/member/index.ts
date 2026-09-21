/**
 * Public API of the `member` entity slice.
 *
 * Everything outside this slice imports from `@/entities/member` — never from
 * the files inside it. That keeps `model/`, `api/` and `ui/` free to move.
 */
export { getMembers, type MemberWithStatus } from "./api/get-members";
export { MemberStatusBadge } from "./ui/member-status-badge";

export {
  addDays,
  countMembersByStatus,
  daysBetween,
  daysUntilExpiry,
  deriveMemberStatus,
  EXPIRING_SOON_DAYS,
  selectRenewalsQueue,
  STATUS_META,
  toDateOnly,
  type MemberStage,
  type MemberStatus,
} from "./model/status";

export type { Member, NewMember } from "./model/types";
