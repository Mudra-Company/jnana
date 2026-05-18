// Shared HMAC token utilities for company invites.
// Token format: base64url(payloadJson) + "." + base64url(hmacSha256(payloadJson, secret))
// payloadJson: { mid, cid, exp }

const enc = new TextEncoder();

function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < u8.length; i++) str += String.fromCharCode(u8[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

export interface InvitePayload {
  mid: string; // member id
  cid: string; // company id
  exp: number; // epoch seconds
}

export function getSigningSecret(): string {
  return (
    Deno.env.get("INVITE_SIGNING_SECRET") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "dev-secret-do-not-use"
  );
}

export async function signInvite(payload: InvitePayload): Promise<string> {
  const secret = getSigningSecret();
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifyInvite(
  token: string,
): Promise<{ valid: boolean; payload?: InvitePayload; reason?: string }> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return { valid: false, reason: "malformed" };
    const secret = getSigningSecret();
    const expected = await hmac(secret, body);
    // constant-time-ish compare
    if (expected.length !== sig.length) return { valid: false, reason: "bad_signature" };
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    if (mismatch !== 0) return { valid: false, reason: "bad_signature" };
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as InvitePayload;
    if (!payload.mid || !payload.cid || !payload.exp) {
      return { valid: false, reason: "malformed_payload" };
    }
    if (Math.floor(Date.now() / 1000) > payload.exp) {
      return { valid: false, payload, reason: "expired" };
    }
    return { valid: true, payload };
  } catch (_e) {
    return { valid: false, reason: "exception" };
  }
}
