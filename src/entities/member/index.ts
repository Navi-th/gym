/**
 * Public API of the `member` entity slice.
 *
 * Everything outside this slice imports from `@/entities/member` — never from
 * the files inside it. That keeps `model/`, `api/` and `ui/` free to move.
 */

// --- data access -----------------------------------------------------------
export {
  getMembers,
  getAllMembers,
  type MemberFilter,
  type MemberSortOption,
  type MemberWithStatus,
} from "./api/get-members";
export type { PaginatedResult } from "@/shared/lib";
export { getMemberById } from "./api/get-member-by-id";
export { createMember } from "./api/create-member";
export { updateMember } from "./api/update-member";
export { archiveMember } from "./api/archive-member";

// --- model -----------------------------------------------------------------
export {
  countMembersByStatus,
  daysUntilExpiry,
  deriveMemberStatus,
  EXPIRING_SOON_DAYS,
  selectRenewalsQueue,
  STATUS_META,
  type MemberStage,
  type MemberStatus,
} from "./model/status";
export {
  DEFAULT_COUNTRY_CODE,
  formatPhone,
  normalisePhone,
} from "./model/phone";
export {
  validateMemberInput,
  type MemberInput,
  type ValidMemberInput,
  type ValidationResult,
} from "./model/validate";
export { DuplicatePhoneError, MemberNotFoundError } from "./model/errors";
export type { Member, NewMember } from "./model/types";

// --- ui --------------------------------------------------------------------
export { MemberStatusBadge } from "./ui/member-status-badge";
