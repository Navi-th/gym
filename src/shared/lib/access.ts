/**
 * Cloudflare Access JWT verification.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS AT ALL, given Access already blocks requests at the edge.
 *
 * If Worker- or path-level Access is configured correctly, unauthenticated
 * requests never reach this code. This is the SECOND lock, and its value is
 * that it is a lock that lives in the repository:
 *
 *   - Access is dashboard configuration. Nobody reviewing this repo sees it,
 *     nothing fails if it is deleted, and "is /admin protected?" has no answer
 *     in the code.
 *   - A path policy that stops matching - a changed route, a new hostname, a
 *     teammate disabling an app while debugging - silently returns the admin
 *     panel to the open internet.
 *
 * With this in place the app fails CLOSED. Member names, phone numbers, emails
 * and emergency contacts do not become public because of a dashboard mistake.
 * ---------------------------------------------------------------------------
 *
 * It only verifies; it does not decide policy. Access remains the thing that
 * says WHO may enter. This just confirms a request actually came through it.
 */

export type AccessConfig = {
  /** e.g. "pulsegym.cloudflareaccess.com" (no scheme). */
  teamDomain: string;
  /** The Access application's Audience (AUD) tag. */
  aud: string;
};

export type AccessIdentity = { email: string | null };

export type AccessResult =
  | { ok: true; identity: AccessIdentity }
  | { ok: false; reason: string };

/** The header Cloudflare Access injects and strips from inbound requests. */
export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

type Jwk = { kid?: string; kty: string; n: string; e: string; alg?: string };

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type JwtPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
};

// Keys rotate rarely; an hour of caching is far below any rotation window and
// keeps this off the critical path for almost every request.
const JWKS_TTL_MS = 60 * 60 * 1000;
let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;

/** Exposed so tests can force a refetch. */
export function clearJwksCache() {
  jwksCache = null;
}

// These return ArrayBuffer rather than Uint8Array on purpose. Under TypeScript
// 5.7+ libs, `new Uint8Array(n)` is Uint8Array<ArrayBufferLike>, which does not
// satisfy the BufferSource that crypto.subtle.verify expects. ArrayBuffer is a
// valid BufferSource and carries no generic to mismatch.
function base64UrlToBuffer(input: string): ArrayBuffer {
  const normalised = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised.padEnd(Math.ceil(normalised.length / 4) * 4, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function utf8ToBuffer(input: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(input);
  const buffer = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(buffer).set(encoded);
  return buffer;
}

function decodeJson<T>(segment: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBuffer(segment))) as T;
  } catch {
    return null;
  }
}

async function getJwks(teamDomain: string): Promise<Jwk[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) {
    throw new Error(`Access JWKS request failed with ${response.status}`);
  }

  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  jwksCache = { keys, fetchedAt: now };
  return keys;
}

/**
 * Verifies a Cloudflare Access JWT.
 *
 * Checks the signature against Cloudflare's published keys, the audience tag,
 * the issuer, and the expiry. A token that fails any of those is rejected.
 */
export async function verifyAccessJwt(
  token: string | null | undefined,
  config: AccessConfig
): Promise<AccessResult> {
  if (!token) return { ok: false, reason: "No Cloudflare Access token on the request." };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "Malformed token." };

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  const header = decodeJson<JwtHeader>(headerSegment);
  const payload = decodeJson<JwtPayload>(payloadSegment);
  if (!header || !payload) return { ok: false, reason: "Token segments are not valid JSON." };

  // Pinning the algorithm blocks the classic "alg: none" and algorithm-swap
  // attacks, where a token is re-signed as HMAC using the public key as the
  // secret.
  if (header.alg !== "RS256") return { ok: false, reason: `Unsupported alg ${header.alg}.` };

  let keys: Jwk[];
  try {
    keys = await getJwks(config.teamDomain);
  } catch (error) {
    // Fail closed: if the keys cannot be fetched, a token cannot be trusted.
    return { ok: false, reason: `Could not fetch Access signing keys: ${String(error)}` };
  }

  const jwk = keys.find((key) => key.kid === header.kid) ?? keys[0];
  if (!jwk) return { ok: false, reason: "No matching signing key." };

  let valid: boolean;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBuffer(signatureSegment),
      utf8ToBuffer(`${headerSegment}.${payloadSegment}`)
    );
  } catch (error) {
    return { ok: false, reason: `Signature check failed: ${String(error)}` };
  }

  if (!valid) return { ok: false, reason: "Signature does not match." };

  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  if (!audiences.includes(config.aud)) {
    // Stops a token minted for a DIFFERENT application on the same team from
    // being replayed against this one.
    return { ok: false, reason: "Token audience does not match this application." };
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return { ok: false, reason: "Token has expired." };
  }

  const expectedIssuer = `https://${config.teamDomain}`;
  if (payload.iss && payload.iss.replace(/\/$/, "") !== expectedIssuer) {
    return { ok: false, reason: "Token issuer does not match the team domain." };
  }

  return { ok: true, identity: { email: payload.email ?? null } };
}

/**
 * Reads Access configuration from the environment.
 *
 * Returns null when it is not configured, which is the local-development case.
 * The caller decides what to do about that; this function does not silently
 * pretend a request is authenticated.
 */
export function readAccessConfig(env: Record<string, string | undefined>): AccessConfig | null {
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim();
  const aud = env.ACCESS_AUD?.trim();
  if (!teamDomain || !aud) return null;
  return { teamDomain: teamDomain.replace(/^https?:\/\//, "").replace(/\/$/, ""), aud };
}
