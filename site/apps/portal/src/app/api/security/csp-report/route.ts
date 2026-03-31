import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    console.warn("[csp-report]", {
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      body: payload,
    });
  } catch (error) {
    console.warn("[csp-report] failed to parse report", error);
  }

  return new NextResponse(null, { status: 204 });
}
