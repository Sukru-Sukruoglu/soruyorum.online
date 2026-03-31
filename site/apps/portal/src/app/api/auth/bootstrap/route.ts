import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "../../../../utils/auth";
import { clearAuthCookie, setAuthCookie } from "../../_lib/authCookie";
import { validateCsrf } from "../../_lib/csrf";

export async function POST(req: NextRequest) {
  const csrfFailure = validateCsrf(req);
  if (csrfFailure) return csrfFailure;

  try {
    const body = (await req.json()) as { token?: unknown };
    const token =
      typeof body?.token === "string" && body.token.trim().length > 0
        ? body.token.trim()
        : "";

    if (!token) {
      console.warn("[portal auth bootstrap] missing token");
      return NextResponse.json({ error: "Token gerekli." }, { status: 400 });
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      console.warn("[portal auth bootstrap] invalid token");
      const response = NextResponse.json(
        { error: "Token geçersiz veya süresi dolmuş." },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const response = NextResponse.json({ ok: true });
    setAuthCookie(response, token);
    console.info("[portal auth bootstrap] success", {
      origin: req.headers.get("origin"),
    });
    return response;
  } catch (error) {
    console.error("[portal auth bootstrap] error:", error);
    const response = NextResponse.json(
      { error: "Oturum başlatılamadı." },
      { status: 500 },
    );
    clearAuthCookie(response);
    return response;
  }
}
