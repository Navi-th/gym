import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_JWT_HEADER,
  readAccessConfig,
  verifyAccessJwt,
} from "@/shared/lib/access";

/**
 * Second lock on the admin area.
 *
 * Cloudflare Access is the first: it stops unauthenticated requests at the
 * edge, before this Worker runs. This middleware is the backstop for when that
 * is absent or wrong — a path policy that stopped matching, someone disabling
 * the Access app while debugging, or a fresh deploy to a hostname nobody
 * protected.
 *
 * Why it matters here specifically: the admin panel serves member names, phone
 * numbers, emails and emergency contacts. Without a backstop, a single
dashbord mistake publishes all of it.
 *
 * WHY THE CONFIG COMES FROM .env AND NOT FROM wrangler vars:
 * Next.js middleware runs in the edge runtime and only sees environment
 * variables that were present at BUILD time. Worker `vars` are runtime values,
 * so they are invisible here. `.env` is read during the build, so values set
 * there are inlined and do work. Both values are public identifiers, not
 * secrets — the AUD tag and team domain appear in any Access-protected URL.
 *
 * FAILING OPEN IN DEVELOPMENT, CLOSED IN PRODUCTION:
 * With no config set, this allows the request and warns. That keeps `next dev`
 * usable, where Access genuinely does not exist. In production, configure it —
 * see DEPLOYMENT.md.
 */

// Scope: the admin area only. The public marketing site must stay reachable.
export const config = {
  matcher: ["/admin/:path*"],
};

let warnedAboutMissingConfig = false;

function forbidden(reason: string) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>403 — not authorised</title>
<meta name="robots" content="noindex">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#090a0f;color:#f8fafc;font:16px/1.6 system-ui,-apple-system,sans-serif}
  main{max-width:34rem;padding:2rem}
  h1{font-size:1.5rem;margin:0 0 .5rem}
  p{color:#94a3b8;margin:0 0 1rem}
  code{background:#1e293b;padding:.15rem .4rem;border-radius:.25rem;font-size:.85em}
</style></head><body><main>
<h1>403 — not authorised</h1>
<p>This area is private. You reached the application without a valid Cloudflare
Access session.</p>
<p>If you are gym staff, sign in through your usual admin link. If you bookmarked
the panel directly, the link may be bypassing the Access gate.</p>
<p><code>${reason}</code></p>
</main></body></html>`,
    { status: 403, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function middleware(request: NextRequest) {
  const accessConfig = readAccessConfig(process.env);

  if (!accessConfig) {
    if (!warnedAboutMissingConfig) {
      warnedAboutMissingConfig = true;
      console.warn(
        "[access] ACCESS_TEAM_DOMAIN / ACCESS_AUD are not set, so /admin is " +
          "UNPROTECTED by this application. Cloudflare Access at the edge is the " +
          "only gate right now. See DEPLOYMENT.md."
      );
    }
    return NextResponse.next();
  }

  const token = request.headers.get(ACCESS_JWT_HEADER);
  const result = await verifyAccessJwt(token, accessConfig);

  if (!result.ok) {
    return forbidden(result.reason);
  }

  // Passed down so later code can attribute an action to a person without
  // re-verifying. Not trusted for authorisation decisions below this point
  // unless it came from here.
  const headers = new Headers(request.headers);
  if (result.identity.email) headers.set("x-admin-email", result.identity.email);

  return NextResponse.next({ request: { headers } });
}
