"use client";

import { portalNavLabel } from "@/lib/portalNavLabel";

export type PortalAuthSession = {
  authenticated: boolean;
  role: string | null;
  organizationId: string | null;
  email: string | null;
  expiresAt: number | null;
  user: {
    name: string | null;
  };
};

export async function fetchPortalAuthSession(): Promise<PortalAuthSession> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      authenticated: false,
      role: null,
      organizationId: null,
      email: null,
      expiresAt: null,
      user: { name: null },
    };
  }

  const data = (await response.json()) as Partial<PortalAuthSession>;
  return {
    authenticated: Boolean(data.authenticated),
    role: data.role ?? null,
    organizationId: data.organizationId ?? null,
    email: data.email ?? null,
    expiresAt: data.expiresAt ?? null,
    user: {
      name: data.user?.name ?? null,
    },
  };
}

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
  } catch {
    // ignore storage failures
  }
}

export function storeLegacyUserName(name: string | null | undefined) {
  if (typeof window === "undefined") return;

  try {
    if (name && name.trim()) {
      localStorage.setItem("user_name", name.trim());
    } else {
      localStorage.removeItem("user_name");
    }
  } catch {
    // ignore storage failures
  }
}

export async function logoutPortalSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } finally {
    clearLegacyAuthStorage();
    storeLegacyUserName(null);
  }
}

export async function bootstrapPortalSession(token: string) {
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Bootstrap auth failed");
  }

  clearLegacyAuthStorage();
}
