import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearJwksCache, readAccessConfig, verifyAccessJwt } from "./access";

const TEAM = "pulsegym.cloudflareaccess.com";
const AUD = "aud-tag-123";
const CONFIG = { teamDomain: TEAM, aud: AUD };

let privateKey: CryptoKey;
let publicJwk: JsonWebKey;
const KID = "test-key-1";

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

/** Signs a token with the test private key, exactly as Cloudflare would. */
async function sign(
  payload: Record<string, unknown>,
  options: { alg?: string; kid?: string; key?: CryptoKey } = {}
): Promise<string> {
  const header = { alg: options.alg ?? "RS256", kid: options.kid ?? KID, typ: "JWT" };
  const head = base64UrlJson(header);
  const body = base64UrlJson(payload);

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    options.key ?? privateKey,
    new TextEncoder().encode(`${head}.${body}`)
  );
  return `${head}.${body}.${base64Url(new Uint8Array(signature))}`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    aud: AUD,
    email: "admin@pulsegym.in",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: `https://${TEAM}`,
    sub: "user-1",
    ...overrides,
  };
}

function stubJwks(keys: unknown[] = [{ ...publicJwk, kid: KID, alg: "RS256", use: "sig" }]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ keys }), { status: 200 }))
  );
}

beforeEach(async () => {
  clearJwksCache();
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
  privateKey = pair.privateKey;
  publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  stubJwks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearJwksCache();
});

describe("verifyAccessJwt - acceptance", () => {
  it("accepts a correctly signed token and reads the email", async () => {
    const result = await verifyAccessJwt(await sign(validPayload()), CONFIG);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.identity.email).toBe("admin@pulsegym.in");
  });

  it("accepts an audience supplied as an array", async () => {
    const token = await sign(validPayload({ aud: ["other-app", AUD] }));
    expect((await verifyAccessJwt(token, CONFIG)).ok).toBe(true);
  });

  it("tolerates a trailing slash on the issuer", async () => {
    const token = await sign(validPayload({ iss: `https://${TEAM}/` }));
    expect((await verifyAccessJwt(token, CONFIG)).ok).toBe(true);
  });
});

describe("verifyAccessJwt - rejection", () => {
  it("rejects a missing token rather than assuming access", async () => {
    expect((await verifyAccessJwt(null, CONFIG)).ok).toBe(false);
    expect((await verifyAccessJwt(undefined, CONFIG)).ok).toBe(false);
    expect((await verifyAccessJwt("", CONFIG)).ok).toBe(false);
  });

  it("rejects a malformed token", async () => {
    expect((await verifyAccessJwt("not.a.jwt.at.all", CONFIG)).ok).toBe(false);
    expect((await verifyAccessJwt("two.parts", CONFIG)).ok).toBe(false);
    expect((await verifyAccessJwt("a.!!!.c", CONFIG)).ok).toBe(false);
  });

  it("rejects alg=none — the classic unsigned-token attack", async () => {
    const head = base64UrlJson({ alg: "none", typ: "JWT" });
    const body = base64UrlJson(validPayload());
    const result = await verifyAccessJwt(`${head}.${body}.`, CONFIG);
    expect(result.ok).toBe(false);
  });

  it("rejects an algorithm swap to HS256", async () => {
    // The attack: re-sign as HMAC using the public key as the shared secret.
    // Pinning RS256 is what stops it.
    const token = await sign(validPayload(), { alg: "HS256" });
    const result = await verifyAccessJwt(token, CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/alg/i);
  });

  it("rejects a token minted for a DIFFERENT application on the same team", async () => {
    const token = await sign(validPayload({ aud: "some-other-aud" }));
    const result = await verifyAccessJwt(token, CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/audience/i);
  });

  it("rejects an expired token", async () => {
    const token = await sign(validPayload({ exp: Math.floor(Date.now() / 1000) - 60 }));
    const result = await verifyAccessJwt(token, CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/expired/i);
  });

  it("rejects a token with no expiry at all", async () => {
    const token = await sign(validPayload({ exp: undefined }));
    expect((await verifyAccessJwt(token, CONFIG)).ok).toBe(false);
  });

  it("rejects a token from a different team", async () => {
    const token = await sign(validPayload({ iss: "https://evil.cloudflareaccess.com" }));
    const result = await verifyAccessJwt(token, CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/issuer/i);
  });

  it("rejects a TAMPERED payload — signature no longer matches", async () => {
    const token = await sign(validPayload());
    const [head, , signature] = token.split(".");
    const forged = base64UrlJson(validPayload({ email: "attacker@evil.com" }));
    const result = await verifyAccessJwt(`${head}.${forged}.${signature}`, CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/signature/i);
  });

  it("rejects a token signed by a key Cloudflare does not publish", async () => {
    const rogue = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    const token = await sign(validPayload(), { key: rogue.privateKey });
    expect((await verifyAccessJwt(token, CONFIG)).ok).toBe(false);
  });

  it("FAILS CLOSED when the signing keys cannot be fetched", async () => {
    // If Cloudflare is unreachable, an unverifiable token must not be trusted.
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    clearJwksCache();
    const result = await verifyAccessJwt(await sign(validPayload()), CONFIG);
    expect(result.ok).toBe(false);
  });

  it("rejects when the JWKS contains no keys", async () => {
    stubJwks([]);
    clearJwksCache();
    expect((await verifyAccessJwt(await sign(validPayload()), CONFIG)).ok).toBe(false);
  });
});

describe("readAccessConfig", () => {
  it("returns null when either value is missing", () => {
    expect(readAccessConfig({})).toBeNull();
    expect(readAccessConfig({ ACCESS_TEAM_DOMAIN: TEAM })).toBeNull();
    expect(readAccessConfig({ ACCESS_AUD: AUD })).toBeNull();
  });

  it("normalises a scheme and trailing slash", () => {
    const config = readAccessConfig({
      ACCESS_TEAM_DOMAIN: `https://${TEAM}/`,
      ACCESS_AUD: AUD,
    });
    expect(config?.teamDomain).toBe(TEAM);
  });

  it("treats whitespace-only values as missing", () => {
    expect(readAccessConfig({ ACCESS_TEAM_DOMAIN: "  ", ACCESS_AUD: AUD })).toBeNull();
  });
});
