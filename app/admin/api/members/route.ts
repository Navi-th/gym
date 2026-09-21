export {
  createMemberHandler as POST,
  listMembersHandler as GET,
} from "@/_app/api-routes";

// Always live: these read and write D1 per request.
export const dynamic = "force-dynamic";
