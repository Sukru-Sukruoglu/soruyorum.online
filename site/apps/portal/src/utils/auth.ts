export type JwtPayload = {
    userId?: string;
    organizationId?: string;
    email?: string;
    role?: string;
    exp?: number;
    iat?: number;
};

function base64UrlDecode(input: string): string {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);

    if (typeof window !== "undefined" && typeof window.atob === "function") {
        return window.atob(padded);
    }

    // Fallback (SSR / Node)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const buf = Buffer.from(padded, "base64");
    return buf.toString("utf-8");
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;

    try {
        const json = base64UrlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export function getRoleFromToken(token: string | null | undefined): string | null {
    return decodeJwtPayload(token)?.role ?? null;
}
