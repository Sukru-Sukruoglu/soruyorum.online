import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "../../../../utils/auth";
import {
  buildPortalAuthSessionFromToken,
  portalAuthSessionUnauthenticated,
} from "../../../../lib/portalAuthSession";
import {
  clearAuthCookie,
  getAuthTokenFromRequest,
} from "../../_lib/authCookie";

export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return NextResponse.json(portalAuthSessionUnauthenticated(), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const session = await buildPortalAuthSessionFromToken(token);
  if (!session.authenticated) {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      console.warn("[portal auth session] expired or invalid token");
    } else {
      console.warn("[portal auth session] token did not resolve to an authenticated session");
    }

    const response = NextResponse.json(portalAuthSessionUnauthenticated(), {
      headers: { "Cache-Control": "no-store" },
    });
    clearAuthCookie(response);
    return response;
  }

  return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
}
