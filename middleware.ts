import { NextResponse, type NextRequest } from "next/server";

/**
 * Global middleware — open access.
 *
 * All routes are open and accessible to all users.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
