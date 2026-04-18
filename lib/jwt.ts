type JwtPayload = { exp?: number } & Record<string, unknown>;

function base64UrlDecode(input: string): string {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  // atob exists in browsers
  return atob(b64);
}

export function safeDecodeJwt(token: string): JwtPayload | null {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== "object") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns true if token has exp and is expired (with optional skew seconds). */
export function isJwtExpired(token: string, skewSeconds = 15): boolean {
  const p = safeDecodeJwt(token);
  const exp = typeof p?.exp === "number" ? p.exp : undefined;
  if (!exp) return false; // if no exp, don't force logout
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + Math.max(0, skewSeconds);
}

