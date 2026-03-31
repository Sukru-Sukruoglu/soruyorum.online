import { NextResponse } from "next/server";
import { prisma } from "@ks-interaktif/database";
import crypto from "node:crypto";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 1000);
}

const NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || "info@soruyorum.online";

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
    const name = sanitize((body as any)?.name);
    const email = sanitize((body as any)?.email);
    const phone = sanitize((body as any)?.phone) || null;
    const subject = sanitize((body as any)?.subject) || null;
    const message = sanitize((body as any)?.message);
    const source = sanitize((body as any)?.source) || null;
    const websiteUrl = sanitize((body as any)?.website_url); // Honeypot field

    // 1. Honeypot Check: If the hidden field is filled, it's a bot
    if (websiteUrl) {
      console.warn("Spam detected via honeypot field");
      // Return success to the bot so it doesn't try other things, but don't actually process it
      return NextResponse.json({ ok: true });
    }

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Lütfen adınızı girin." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Lütfen geçerli bir e-posta adresi girin." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, message: "Lütfen mesajınızı yazın." },
        { status: 400 },
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
    const userAgent = req.headers.get("user-agent");

    const db = prisma as any;

    // 2. Simple Rate Limiting: Max 3 submissions per IP per hour
    if (ip) {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await db.contact_submissions.count({
          where: {
            ip_address: ip,
            created_at: { gte: oneHourAgo }
          }
        });

        if (recentCount >= 3) {
          return NextResponse.json(
            { ok: false, message: "Çok fazla istek gönderdiniz. Lütfen bir saat sonra tekrar deneyin." },
            { status: 429 },
          );
        }
      } catch (err) {
        console.error("Rate limit check failed:", err);
      }
    }

    await db.contact_submissions.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        subject,
        message,
        source,
        ip_address: ip,
        user_agent: userAgent,
      },
    });

    // Try sending notification email (non-blocking)
    try {
      const mailProvider = process.env.MAIL_PROVIDER?.trim().toLowerCase() || "smtp";
      const mailFrom = process.env.MAIL_FROM?.trim() || "no-reply@soruyorum.online";
      const mailFromName = process.env.MAIL_FROM_NAME?.trim() || "SoruYorum.Online";
      const subjectText = `İletişim Formu: ${subject || "Genel"} - ${name}`;
      const htmlContent = `
        <h2>Yeni İletişim Formu Mesajı</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Ad Soyad:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">E-posta:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Telefon:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone || "-"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Konu:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${subject || "-"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; vertical-align: top;">Mesaj:</td><td style="padding: 8px;">${message.replace(/\n/g, "<br>")}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #888; font-size: 12px;">Bu mesaj soruyorum.online iletişim formundan gönderilmiştir.</p>
      `;
      const textContent = `Ad Soyad: ${name}\nE-posta: ${email}\nTelefon: ${phone || "-"}\nKonu: ${subject || "-"}\nMesaj: ${message}`;

      if (mailProvider === "brevo" && process.env.BREVO_API_KEY) {
        // Use Brevo HTTPS API (Port 443, usually not blocked)
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: mailFromName, email: mailFrom },
            to: [{ email: NOTIFICATION_EMAIL }],
            subject: subjectText,
            htmlContent: htmlContent,
            textContent: textContent,
          }),
        });
      } else {
        // Fallback to SMTP
        const smtpHost = process.env.SMTP_HOST?.trim();
        if (smtpHost) {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.default.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || "587", 10),
            secure: (process.env.SMTP_SECURE || "false").toLowerCase() === "true",
            auth: {
              user: process.env.SMTP_USER?.trim(),
              pass: process.env.SMTP_PASS?.trim(),
            },
            timeout: 10000,
          });

          await transporter.sendMail({
            from: `${mailFromName} <${mailFrom}>`,
            to: NOTIFICATION_EMAIL,
            subject: subjectText,
            html: htmlContent,
            text: textContent,
          });
        }
      }
    } catch (mailError: any) {
      // Mail gönderimi başarısız olsa bile form kaydedildi, hata verme ama logla
      console.error("Contact form notification mail failed:", mailError?.message || mailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { ok: false, message: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
