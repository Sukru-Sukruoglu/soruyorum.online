import { NextResponse } from "next/server";
import { prisma } from "@ks-interaktif/database";
import crypto from "node:crypto";

function isValidEmail(email: string) {
  // Basic sanity check; keep it simple to avoid rejecting valid addresses.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: "Geçersiz istek." },
        { status: 415 },
      );
    }

    const body = (await req.json()) as unknown;
    const email =
      typeof (body as any)?.email === "string" ? (body as any).email.trim() : "";
    const consent = Boolean((body as any)?.consent);
    const source =
      typeof (body as any)?.source === "string" ? (body as any).source : null;

    if (!consent) {
      return NextResponse.json(
        { ok: false, message: "Lütfen gizlilik politikasını kabul edin." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Lütfen geçerli bir e-posta adresi girin." },
        { status: 400 },
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
    const userAgent = req.headers.get("user-agent");

    // Note: In some dev/editor setups Prisma types may lag behind generated client.
    // Runtime is correct after `prisma generate` during the Docker build.
    const db = prisma as any;

    try {
      await db.newsletter_subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          email,
          source,
          consent: true,
          ip_address: ip,
          user_agent: userAgent,
        },
      });

      return NextResponse.json({ ok: true, status: "subscribed" });
    } catch (error: any) {
      // Unique constraint violation -> already subscribed
      if (typeof error?.code === "string" && error.code === "P2002") {
        return NextResponse.json({ ok: true, status: "exists" });
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "İşlem sırasında bir hata oluştu." },
      { status: 500 },
    );
  }
}
