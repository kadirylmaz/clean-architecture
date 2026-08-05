interface JwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

/** Decodes a JWT payload without verifying the signature (verification happens server-side). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.sub ?? null;
}

export function isTokenExpired(token: string, skewSeconds = 15): boolean {
  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return true;
  }

  return Date.now() >= (payload.exp - skewSeconds) * 1000;
}
