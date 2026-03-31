import { cookies } from "next/headers";
import { getAuthCookieName } from "@/app/api/_lib/authCookie";
import { buildPortalAuthSessionFromToken } from "@/lib/portalAuthSession";
import { portalNavLabel } from "@/lib/portalNavLabel";

export type MarketingNavUser = { authenticated: boolean; label: string };

export async function getMarketingNavUser(): Promise<MarketingNavUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value?.trim() ?? null;
  if (!token) return { authenticated: false, label: "" };
  const session = await buildPortalAuthSessionFromToken(token);
  if (!session.authenticated) return { authenticated: false, label: "" };
  return { authenticated: true, label: portalNavLabel(session) };
}
