import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { members, plans } from "@/lib/db/schema";

/**
 * TEMPORARY smoke test — delete once the admin dashboard replaces it.
 *
 * Proves, end to end, the one chain that everything else depends on:
 *
 *   Next.js route -> getCloudflareContext() -> env.DB -> drizzle -> D1
 *
 * That chain crosses an OpenNext boundary and needs
 * `initOpenNextCloudflareForDev()` in next.config.mjs to work under
 * `next dev`. Config looking right and it actually working are different
 * claims, so we test it before building six modules on top of it.
 *
 * It exercises the binding RAW as well as through Drizzle, so a failure
 * tells us which layer broke.
 */
export async function GET() {
  const result: Record<string, unknown> = {};

  // Layer 1 — can we reach the binding at all?
  try {
    const { env } = getCloudflareContext();
    if (!env.DB) {
      return Response.json(
        {
          ok: false,
          layer: "binding",
          error:
            "env.DB is undefined. Check the d1_databases block in wrangler.jsonc and that initOpenNextCloudflareForDev() is called in next.config.mjs.",
        },
        { status: 500 }
      );
    }
    result.binding = "ok";

    // Raw prepared statement — isolates D1 itself from the ORM.
    const raw = await env.DB.prepare("SELECT COUNT(*) AS n FROM members").first<{
      n: number;
    }>();
    result.rawMemberCount = raw?.n ?? null;
  } catch (err) {
    return Response.json(
      { ok: false, layer: "raw-d1", error: String(err) },
      { status: 500 }
    );
  }

  // Layer 2 — does the Drizzle client work through that binding?
  try {
    const db = getDb();
    const allMembers = await db.select().from(members);
    const allPlans = await db.select().from(plans);

    result.drizzleMemberCount = allMembers.length;
    result.drizzlePlanCount = allPlans.length;
    result.sample = allMembers.slice(0, 3).map((m) => ({
      code: m.memberCode,
      name: m.fullName,
      stage: m.stage,
      planEnd: m.planEnd,
    }));
  } catch (err) {
    return Response.json(
      { ok: false, layer: "drizzle", error: String(err) },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, ...result });
}
