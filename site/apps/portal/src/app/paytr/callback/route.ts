import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:4000";

async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = `${API_URL}/api/payments/paytr/callback${url.search}`;

  try {
    const body =
      req.method !== "GET" && req.method !== "DELETE"
        ? await req.text()
        : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...(body !== undefined
          ? {
              "Content-Type":
                req.headers.get("Content-Type") ||
                "application/x-www-form-urlencoded",
            }
          : {}),
        "X-Forwarded-Host": req.headers.get("host") || "",
        "X-Forwarded-Proto": req.headers.get("x-forwarded-proto") || "https",
        "X-Forwarded-For": req.headers.get("x-forwarded-for") || "",
      },
      body,
    });

    const data = await response.text();
    const contentType = response.headers.get("content-type");

    return new NextResponse(data, {
      status: response.status,
      headers: contentType ? { "Content-Type": contentType } : undefined,
    });
  } catch (error) {
    console.error("Legacy PAYTR callback proxy error:", error);
    return NextResponse.json(
      { error: "Callback proxy failed" },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;