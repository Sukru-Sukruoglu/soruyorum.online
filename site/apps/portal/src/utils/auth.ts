export type JwtPayload = {
    userId?: string;
    organizationId?: string;
    email?: string;
    role?: string;
    exp?: number;
    iat?: number;
};

const DEFAULT_SUPERADMIN_ROLES = ["superadmin", "super_admin", "root", "system", "owner"];

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

export function isSuperAdminRole(role: string | null | undefined): boolean {
    if (!role) return false;
    const normalized = String(role).trim().toLowerCase();
    return DEFAULT_SUPERADMIN_ROLES.includes(normalized);
}

/**
 * Superadmin veya JuniorAdmin → plan/abonelik kısıtlaması yok.
 */
export function hasFullAccessRole(role: string | null | undefined): boolean {
    if (isSuperAdminRole(role)) return true;
    if (!role) return false;
    return String(role).trim().toLowerCase() === "junioradmin";
}

export function isSuperAdminToken(token: string | null | undefined): boolean {
    const payload = decodeJwtPayload(token);
    return isSuperAdminRole(payload?.role ?? null);
}
