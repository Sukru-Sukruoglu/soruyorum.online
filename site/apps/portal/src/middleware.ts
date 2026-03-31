import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SORUYORUM_HOSTS = new Set(["soruyorum.online", "www.soruyorum.online"]);
const TABLET_HOSTS = new Set(["tablet.soruyorum.online"]);
const MOBIL_HOSTS = new Set(["mobil.soruyorum.online"]);

const TABLET_BYPASS_PREFIXES = [
    "/assets",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/check-email",
    "/verify-email",
    "/kvkk",
    "/acik-riza",
    "/api",
    "/_next",
    "/favicon.ico",
];

const BLOCKED_PREFIXES = [
    "/events/new/wordcloud",
    "/events/new/wheeloffortune",
    "/events/new/ranking",
    "/events/new/matching",
    "/presentation/wordcloud",
    "/presentation/wheeloffortune",
    "/presentation/ranking",
    "/presentation/matching",
];

const FRAMEABLE_PREFIXES = ["/join"];

function shouldAllowFraming(pathname: string) {
    if (FRAMEABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
        return true;
    }

    return /^\/events\/[^/]+\/live(?:\/|$)/.test(pathname);
}

function withFrameHeaders(res: NextResponse, pathname: string) {
    if (shouldAllowFraming(pathname)) {
        res.headers.delete("x-frame-options");
        return res;
    }

    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    return res;
}

export function middleware(req: NextRequest) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const originalHost = req.headers.get("x-original-host")?.split(",")[0]?.trim();
    const requestHost = forwardedHost || originalHost || req.headers.get("host") || "";
    const host = requestHost.split(":")[0]?.toLowerCase();
    const pathname = req.nextUrl.pathname;

    // Mobil subdomain: redirect / to /join
    if (host && MOBIL_HOSTS.has(host)) {
        if (pathname === "/") {
            const url = req.nextUrl.clone();
            url.pathname = "/join";
            return withFrameHeaders(NextResponse.redirect(url), url.pathname);
        }
        return withFrameHeaders(NextResponse.next(), pathname);
    }

    // Host-based tablet UI: map tablet.soruyorum.online/* -> /tablet/*
    if (host && TABLET_HOSTS.has(host)) {
        if (TABLET_BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
            return withFrameHeaders(NextResponse.next(), pathname);
        }

        if (pathname.startsWith("/tablet")) {
            return withFrameHeaders(NextResponse.next(), pathname);
        }

        const url = req.nextUrl.clone();
        url.pathname = pathname === "/" ? "/tablet" : `/tablet${pathname}`;
        return withFrameHeaders(NextResponse.rewrite(url), url.pathname);
    }

    if (!host || !SORUYORUM_HOSTS.has(host)) {
        return withFrameHeaders(NextResponse.next(), pathname);
    }

    // Redirect .html URLs to clean URLs (e.g. /login.html -> /login)
    if (pathname.endsWith(".html")) {
        const url = req.nextUrl.clone();
        url.pathname = pathname.replace(/\.html$/, "");
        return withFrameHeaders(NextResponse.redirect(url, 301), url.pathname);
    }

    if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        const url = req.nextUrl.clone();
        url.pathname = "/events/new";
        url.search = "";
        return withFrameHeaders(NextResponse.redirect(url), url.pathname);
    }

    return withFrameHeaders(NextResponse.next(), pathname);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
