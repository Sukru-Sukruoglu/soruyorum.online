"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketingNavUser } from "@/lib/getMarketingNavUser";
import { portalNavLabel } from "@/lib/portalNavLabel";
import {
  fetchPortalAuthSession,
  type PortalAuthSession,
} from "@/utils/authSession";

function navLabelFromSession(session: PortalAuthSession): string {
  const trimmed = session.user.name?.trim();
  if (trimmed) return trimmed;
  try {
    const stored = localStorage.getItem("user_name")?.trim();
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return portalNavLabel(session);
}

export function PublicMarketingAuthButtons({
  initialNavUser,
}: {
  initialNavUser: MarketingNavUser;
}) {
  const [navUser, setNavUser] = useState(() => initialNavUser);

  useEffect(() => {
    let mounted = true;
    const sync = () => {
      void fetchPortalAuthSession()
        .then((session) => {
          if (!mounted) return;
          if (session.authenticated) {
            setNavUser({
              authenticated: true,
              label: navLabelFromSession(session),
            });
          } else {
            setNavUser({ authenticated: false, label: "" });
          }
        })
        .catch(() => {});
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mounted = false;
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (navUser.authenticated) {
    return (
      <div
        className="main-menu-two__btn-box"
        style={{ display: "flex", gap: "10px" }}
        id="auth-buttons"
      >
        <Link
          href="/dashboard"
          className="thm-btn"
          title="Kontrol paneline git"
          style={{ maxWidth: 280 }}
        >
          <span
            style={{
              display: "inline-block",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
            }}
          >
            {navUser.label}
          </span>
          <span className="icon-right-arrow"></span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="main-menu-two__btn-box"
      style={{ display: "flex", gap: "10px" }}
      id="auth-buttons"
    >
      <Link
        href="/login"
        className="thm-btn"
        id="btn-login"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
        }}
      >
        Giriş<span className="icon-right-arrow"></span>
      </Link>
      <Link href="/register" className="thm-btn" id="btn-register">
        Kayıt<span className="icon-right-arrow"></span>
      </Link>
    </div>
  );
}
