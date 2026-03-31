import type { NextRequest, NextResponse } from "next/server";

const DEFAULT_AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-soruyorum_auth"
    : "soruyorum_auth";
const DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthCookieSameSite(): "lax" | "strict" | "none" {
  const raw = (process.env.AUTH_COOKIE_SAME_SITE || "lax").trim().toLowerCase();
  if (raw === "strict" || raw === "none") return raw;
  return "lax";
}

function getAuthCookieDomain(): string | undefined {
  const configured = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return configured && configured.length > 0 ? configured : undefined;
}

function buildAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: getAuthCookieSameSite(),
    path: "/",
    domain: getAuthCookieDomain(),
    maxAge,
  } as const;
}

export function getAuthCookieName() {
  const configured = process.env.AUTH_COOKIE_NAME?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_AUTH_COOKIE_NAME;
}

export function getAuthCookieMaxAgeSeconds() {
  const parsed = Number.parseInt(
    process.env.AUTH_COOKIE_MAX_AGE_SECONDS ?? "",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_AUTH_COOKIE_MAX_AGE_SECONDS;
}

export function getAuthTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken) return headerToken;
  }

  const cookieToken = req.cookies.get(getAuthCookieName())?.value?.trim();
  return cookieToken || null;
}

export function applyAuthorizationHeader(
  req: NextRequest,
  headers: Headers | Record<string, string>,
) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return;

  if (headers instanceof Headers) {
    headers.set("Authorization", `Bearer ${token}`);
    return;
  }

  headers.Authorization = `Bearer ${token}`;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: getAuthCookieName(),
    value: token,
    ...buildAuthCookieOptions(getAuthCookieMaxAgeSeconds()),
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: getAuthCookieName(),
    value: "",
    ...buildAuthCookieOptions(0),
  });
}
