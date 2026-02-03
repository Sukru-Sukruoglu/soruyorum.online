import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SORUYORUM_HOSTS = new Set(["soruyorum.online", "www.soruyorum.online"]);
const TABLET_HOSTS = new Set(["tablet.soruyorum.online"]);
const MOBIL_HOSTS = new Set(["mobil.soruyorum.online"]);

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

export function middleware(req: NextRequest) {
    const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
    const pathname = req.nextUrl.pathname;

    // Mobil subdomain: redirect / to /join
    if (host && MOBIL_HOSTS.has(host)) {
        if (pathname === "/") {
            const url = req.nextUrl.clone();
            url.pathname = "/join";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Host-based tablet UI: map tablet.soruyorum.online/* -> /tablet/*
    if (host && TABLET_HOSTS.has(host)) {
        if (pathname.startsWith("/tablet")) {
            return NextResponse.next();
        }

        const url = req.nextUrl.clone();
        url.pathname = pathname === "/" ? "/tablet" : `/tablet${pathname}`;
        return NextResponse.rewrite(url);
    }

    if (!host || !SORUYORUM_HOSTS.has(host)) {
        return NextResponse.next();
    }
    if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        const url = req.nextUrl.clone();
        url.pathname = "/events/new";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
