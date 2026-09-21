/**
 * Liveness endpoint.
 *
 * Exported as `getHealth` rather than `GET` so the HTTP verb mapping stays in
 * `app/api/health/route.ts`. That keeps this layer free of Next.js routing
 * conventions and callable directly from a test.
 *
 * Uses the standard `Response.json` rather than `NextResponse` — this runs on
 * Workers and needs nothing from the Next server runtime.
 */
export function getHealth() {
  return Response.json({
    status: "online",
    platform: "Cloudflare Workers / OpenNext",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    edgeInfo: {
      location: "Edge-Global",
      compatFlags: ["nodejs_compat"],
    },
  });
}
