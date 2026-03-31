import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    const candidates = [
        path.join(process.cwd(), "public", "assets", "images", "favicons", "favicon.ico"),
        path.join(process.cwd(), "apps", "portal", "public", "assets", "images", "favicons", "favicon.ico"),
    ];

    let bytes: Buffer | null = null;
    for (const candidate of candidates) {
        try {
            bytes = await readFile(candidate);
            break;
        } catch {
            // try next candidate
        }
    }

    if (!bytes) {
        return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(bytes, {
        headers: {
            "Content-Type": "image/x-icon",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
