import { decodeJwtPayload } from "@/utils/auth";
import type { PortalAuthSession } from "@/utils/authSession";

const API_URL = process.env.API_URL || "http://localhost:4000";

export function portalAuthSessionUnauthenticated(): PortalAuthSession {
  return {
    authenticated: false,
    role: null,
    organizationId: null,
    email: null,
    expiresAt: null,
    user: { name: null },
  };
}

/** Resolves session from JWT cookie — same data as GET /api/auth/session (without clearing expired cookies). */
export async function buildPortalAuthSessionFromToken(
  token: string,
): Promise<PortalAuthSession> {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    return portalAuthSessionUnauthenticated();
  }

  let userName: string | null = null;
  let userRole: string | null = null;
  let userEmail: string | null = null;
  try {
    const upstream = await fetch(`${API_URL}/api/settings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (upstream.ok) {
      const data = await upstream.json().catch(() => null);
      if (data && typeof data.name === "string" && data.name.trim()) {
        userName = data.name.trim();
      }
      if (data && typeof data.role === "string" && data.role.trim()) {
        userRole = data.role.trim();
      }
      if (data && typeof data.email === "string" && data.email.trim()) {
        userEmail = data.email.trim();
      }
    }
  } catch (error) {
    console.warn("[portal auth session] failed to fetch user settings", error);
  }

  return {
    authenticated: true,
    role: userRole ?? payload.role ?? null,
    organizationId: payload.organizationId ?? null,
    email: userEmail ?? payload.email ?? null,
    expiresAt: payload.exp ? payload.exp * 1000 : null,
    user: {
      name: userName,
    },
  };
}
