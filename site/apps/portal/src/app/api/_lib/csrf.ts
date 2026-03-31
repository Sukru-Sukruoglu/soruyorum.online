import { NextRequest, NextResponse } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getAllowedOrigins(): string[] {
  const configured = (process.env.CSRF_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const defaults = [
    process.env.PORTAL_BASE_URL,
    process.env.FRONTEND_URL,
    "https://soruyorum.online",
    "https://www.soruyorum.online",
    "https://tablet.soruyorum.online",
    "https://mobil.soruyorum.online",
  ].filter((value): value is string => Boolean(value && value.trim()));

  return Array.from(new Set([...configured, ...defaults]));
}

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getRequestSourceOrigin(req: NextRequest): string | null {
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (origin) return origin;
  return normalizeOrigin(req.headers.get("referer"));
}

export function validateCsrf(req: NextRequest): NextResponse | null {
  if (!UNSAFE_METHODS.has(req.method.toUpperCase())) {
    return null;
  }

  const sourceOrigin = getRequestSourceOrigin(req);
  const allowedOrigins = getAllowedOrigins();
  if (sourceOrigin && allowedOrigins.includes(sourceOrigin)) {
    return null;
  }

  console.warn("[csrf] blocked request", {
    method: req.method,
    path: req.nextUrl.pathname,
    origin: req.headers.get("origin"),
    referer: req.headers.get("referer"),
  });

  return NextResponse.json(
    { error: "CSRF validation failed." },
    { status: 403 },
  );
}
