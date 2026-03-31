import { NextRequest, NextResponse } from "next/server";
import { copyForwardedContextHeaders } from "../../_lib/forwardProxyHeaders";
import { clearAuthCookie, setAuthCookie } from "../../_lib/authCookie";
import { validateCsrf } from "../../_lib/csrf";

const API_URL = process.env.API_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  const csrfFailure = validateCsrf(req);
  if (csrfFailure) return csrfFailure;

  try {
    const body = await req.text();
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
    };

    copyForwardedContextHeaders(req, headers);

    const upstream = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers,
      body,
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok || !data) {
      console.warn("[portal auth register] failed", {
        status: upstream.status || 500,
        origin: req.headers.get("origin"),
      });
      const response = NextResponse.json(
        data ?? { error: "Kayıt sırasında hata oluştu." },
        { status: upstream.status || 500 },
      );
      clearAuthCookie(response);
      return response;
    }

    const response = NextResponse.json(
      {
        verificationRequired: Boolean(data.verificationRequired),
        user: data.user ?? null,
        organization: data.organization ?? null,
      },
      { status: upstream.status },
    );

    if (typeof data.token === "string" && data.token.trim()) {
      setAuthCookie(response, data.token.trim());
    } else {
      clearAuthCookie(response);
    }

    console.info("[portal auth register] success", {
      verificationRequired: Boolean(data.verificationRequired),
      origin: req.headers.get("origin"),
    });

    return response;
  } catch (error) {
    console.error("[portal auth register] error:", error);
    const response = NextResponse.json(
      { error: "Kayıt sırasında hata oluştu." },
      { status: 500 },
    );
    clearAuthCookie(response);
    return response;
  }
}
