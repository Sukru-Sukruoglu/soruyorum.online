import { isIP } from "node:net";
import { redis } from "../config/redis";

const GEO_CACHE_PREFIX = "geoip:";
const GEO_CACHE_TTL_SECONDS = 60 * 60 * 24;

export interface GeoInfo {
    ip: string;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    region: string | null;
    source: "header" | "lookup" | "cache" | "private" | "unknown";
}

type GeoHints = {
    country?: string | null;
    countryCode?: string | null;
    city?: string | null;
    region?: string | null;
};

function normalizeNullable(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

export function normalizeIp(rawIp: string | null | undefined): string | null {
    const initial = normalizeNullable(rawIp);
    if (!initial) return null;

    const first = initial.split(",")[0]?.trim() ?? initial;
    const withoutMappedPrefix = first.startsWith("::ffff:") ? first.slice(7) : first;

    if (withoutMappedPrefix.startsWith("[") && withoutMappedPrefix.includes("]")) {
        const endIndex = withoutMappedPrefix.indexOf("]");
        return withoutMappedPrefix.slice(1, endIndex) || null;
    }

    const colonCount = withoutMappedPrefix.split(":").length - 1;
    if (colonCount === 1 && withoutMappedPrefix.includes(".")) {
        return withoutMappedPrefix.split(":")[0] || null;
    }

    return withoutMappedPrefix;
}

function isPrivateIpv4(ip: string): boolean {
    const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
        return false;
    }

    return (
        parts[0] === 10
        || parts[0] === 127
        || (parts[0] === 169 && parts[1] === 254)
        || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
        || (parts[0] === 192 && parts[1] === 168)
    );
}

function isPrivateIpv6(ip: string): boolean {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
}

function isPrivateIp(ip: string): boolean {
    const version = isIP(ip);
    if (version === 4) return isPrivateIpv4(ip);
    if (version === 6) return isPrivateIpv6(ip);
    return false;
}

function withDefaults(ip: string, source: GeoInfo["source"], hints?: GeoHints): GeoInfo {
    return {
        ip,
        country: normalizeNullable(hints?.country),
        countryCode: normalizeNullable(hints?.countryCode),
        city: normalizeNullable(hints?.city),
        region: normalizeNullable(hints?.region),
        source,
    };
}

async function readCachedGeo(ip: string): Promise<GeoInfo | null> {
    const cached = await redis.get(`${GEO_CACHE_PREFIX}${ip}`);
    if (!cached) return null;

    try {
        const parsed = JSON.parse(cached) as Omit<GeoInfo, "source"> & { source?: GeoInfo["source"] };
        return {
            ip,
            country: normalizeNullable(parsed.country),
            countryCode: normalizeNullable(parsed.countryCode),
            city: normalizeNullable(parsed.city),
            region: normalizeNullable(parsed.region),
            source: "cache",
        };
    } catch {
        return null;
    }
}

async function writeCachedGeo(geo: GeoInfo): Promise<void> {
    await redis.set(
        `${GEO_CACHE_PREFIX}${geo.ip}`,
        JSON.stringify({
            ip: geo.ip,
            country: geo.country,
            countryCode: geo.countryCode,
            city: geo.city,
            region: geo.region,
        }),
        "EX",
        GEO_CACHE_TTL_SECONDS
    );
}

export function extractGeoHints(headers: Record<string, unknown>): GeoHints {
    return {
        country: normalizeNullable(headers["x-vercel-ip-country-name"]) ?? null,
        countryCode: normalizeNullable(headers["cf-ipcountry"]) ?? normalizeNullable(headers["x-vercel-ip-country"]) ?? null,
        city: normalizeNullable(headers["x-vercel-ip-city"]) ?? normalizeNullable(headers["cf-ipcity"]) ?? null,
        region: normalizeNullable(headers["x-vercel-ip-country-region"]) ?? normalizeNullable(headers["cf-region"]) ?? null,
    };
}

export async function resolveGeoForIp(rawIp: string | null | undefined, hints?: GeoHints): Promise<GeoInfo | null> {
    const ip = normalizeIp(rawIp);
    if (!ip) return null;

    if (isPrivateIp(ip)) {
        return withDefaults(ip, "private");
    }

    const hintedGeo = withDefaults(ip, "header", hints);
    if (hintedGeo.country || hintedGeo.countryCode || hintedGeo.city || hintedGeo.region) {
        await writeCachedGeo(hintedGeo);
        return hintedGeo;
    }

    const cached = await readCachedGeo(ip);
    if (cached) return cached;

    try {
        const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
            signal: AbortSignal.timeout(2500),
        });
        if (!response.ok) {
            return withDefaults(ip, "unknown");
        }

        const payload = await response.json() as {
            success?: boolean;
            country?: string;
            country_code?: string;
            city?: string;
            region?: string;
        };

        if (payload.success === false) {
            return withDefaults(ip, "unknown");
        }

        const resolved = withDefaults(ip, "lookup", {
            country: payload.country,
            countryCode: payload.country_code,
            city: payload.city,
            region: payload.region,
        });
        await writeCachedGeo(resolved);
        return resolved;
    } catch {
        return withDefaults(ip, "unknown");
    }
}