import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "../../_lib/authCookie";
import { validateCsrf } from "../../_lib/csrf";

export async function POST(req: NextRequest) {
  const csrfFailure = validateCsrf(req);
  if (csrfFailure) return csrfFailure;

  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  console.info("[portal auth logout] success", {
    origin: req.headers.get("origin"),
  });
  return response;
}
