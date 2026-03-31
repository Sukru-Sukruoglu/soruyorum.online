"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, FileText, Settings, Briefcase, LogOut, Users, Crown, Activity, CreditCard } from "lucide-react";
import { Logo } from "@ks-interaktif/ui";
import { isSuperAdminRole } from "../../utils/auth";
import { fetchPortalAuthSession, logoutPortalSession } from "../../utils/authSession";
import { UpgradeContactModal } from "../upgrade/UpgradeContactModal";
import { applyDashboardPreferences, readStoredDashboardFontSize, readStoredDashboardTheme } from "../../utils/dashboardPreferences";
import { useCart } from "../../utils/useCart";

const NAV_ITEMS = [
    { label: "Etkinliklerim", icon: LayoutDashboard, href: "/dashboard", exact: true },
    { label: "İstatistikler", icon: BarChart2, href: "/dashboard/stats", exact: false },
    { label: "Raporlar", icon: FileText, href: "/dashboard/reports", exact: false },
    { label: "Çalışma Alanım", icon: Briefcase, href: "/dashboard/workspace", exact: false },
    { label: "Ayarlar", icon: Settings, href: "/dashboard/settings", exact: true },
];

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { lineCount, total } = useCart();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [role, setRole] = useState<string | null | undefined>(undefined);
    const [contactOpen, setContactOpen] = useState(false);
    const [userName, setUserName] = useState("Kullanici");

    const isEditor = /^\/events\/[^/]+\/edit/.test(pathname);
    useEffect(() => {
        if (isEditor) return;
        const syncPreferences = () => {
            applyDashboardPreferences({
                theme: readStoredDashboardTheme(),
                fontSize: readStoredDashboardFontSize(),
                persist: false,
            });
        };

        syncPreferences();

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = () => {
            if (readStoredDashboardTheme() === "system") {
                syncPreferences();
            }
        };

        window.addEventListener("storage", syncPreferences);
        mediaQuery.addEventListener("change", handleSystemThemeChange);

        return () => {
            window.removeEventListener("storage", syncPreferences);
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, [isEditor]);

    /* Mobile-menu body class */
    useEffect(() => {
        if (mobileMenuOpen) document.body.classList.add("mobile-menu-visible");
        else document.body.classList.remove("mobile-menu-visible");
    }, [mobileMenuOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
        setContactOpen(false);
        document.body.classList.remove("mobile-menu-visible");
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
        document.documentElement.style.overflow = "";
        document.documentElement.style.pointerEvents = "";
    }, [pathname]);

    /* Auth role */
    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (!mounted) return;
                setRole(session.role);
                if (session.user.name?.trim()) {
                    setUserName(session.user.name.trim());
                }
            })
            .catch(() => {
                if (mounted) setRole(null);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const syncUserName = () => {
            try {
                const storedName = localStorage.getItem("user_name")?.trim();
                setUserName(storedName && storedName.length > 0 ? storedName : "Kullanici");
            } catch {
                setUserName("Kullanici");
            }
        };

        syncUserName();
        window.addEventListener("storage", syncUserName);

        return () => {
            window.removeEventListener("storage", syncUserName);
        };
    }, []);

    const navItems = useMemo(() => {
        if (!isSuperAdminRole(role)) return NAV_ITEMS;
        return [
            ...NAV_ITEMS.slice(0, 4),
            { label: "Kullanıcılar", icon: Users, href: "/dashboard/users", exact: false },
            { label: "Billing Ops", icon: CreditCard, href: "/dashboard/billing-ops", exact: false },
            { label: "Canlı İzleme", icon: Activity, href: "/dashboard/monitoring", exact: false },
            { label: "Fiyatlandırma", icon: CreditCard, href: "/dashboard/settings/pricing", exact: false },
            ...NAV_ITEMS.slice(4),
        ];
    }, [role]);

    const userInitials = useMemo(() => {
        const normalized = userName.trim();
        if (!normalized) return "KU";

        const parts = normalized.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }, [userName]);

    const handleLogout = () => {
        void logoutPortalSession().finally(() => {
            window.location.href = "/";
        });
    };

    /* Derive breadcrumb title from pathname */
    const pageTitle = (() => {
        const active = navItems.find((item) =>
            item.exact ? pathname === item.href : pathname.startsWith(item.href)
        );
        return active?.label || "Kontrol Paneli";
    })();

    /* ── sidebar width constant ── */
    const SIDEBAR_W = 260;
    const HEADER_H = 70; /* nav bar height */

    /* Editor pages manage their own full-screen layout – skip sidebar/header */
    const isEditorPage = /^\/events\/[^/]+\/edit/.test(pathname);
    if (isEditorPage) {
        return <>{children}</>;
    }

    return (
        <div className="page-wrapper dashboard-shell" style={{ overflow: "hidden" }}>
            {/* ── Fixed Header (top bar hidden, only nav) ── */}
            <header
                className="dashboard-shell__header"
                style={{
                    position: "fixed",
                    top: 0,
                    left: SIDEBAR_W,
                    right: 0,
                    zIndex: 40,
                    background: "var(--dashboard-shell-bg)",
                    borderBottom: "1px solid var(--dashboard-border-color)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
            >
                <nav className="dashboard-shell__topnav" style={{ position: "relative", background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 70 }}>
                    <div className="dashboard-shell__header-left" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                        <a
                            href="#"
                            className="mobile-nav__toggler dashboard-shell__mobile-toggle"
                            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(true); }}
                            style={{ color: "var(--dashboard-heading)", display: "none" }}
                            aria-label="Navigasyonu ac"
                        >
                            <i className="fa fa-bars"></i>
                        </a>
                        <ul className="dashboard-shell__desktop-links" style={{ display: "flex", listStyle: "none", margin: 0, padding: 0, gap: 4 }}>
                            <li><a href="/#home" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, transition: "background 0.2s", whiteSpace: "nowrap" }}>AnaSayfa</a></li>
                            <li><a href="/#about" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>Hakkımızda</a></li>
                            <li><a href="/plans-preview" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>Fiyatlandırma</a></li>
                            <li><a href="/#services" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>Kullanım Alanları</a></li>
                            <li><a href="/#use-cases" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>Neden Soru-Yorum</a></li>
                            <li><a href="/#how-it-works" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>Nasıl Çalışır</a></li>
                            <li><a href="/#contact" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "6px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>İletişim</a></li>
                        </ul>
                    </div>
                    <div className="dashboard-shell__header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {lineCount > 0 && pathname !== "/dashboard/billing" && (
                            <Link
                                href="/dashboard/billing"
                                className="dashboard-shell__cart-chip"
                                title="Sepete git"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 10,
                                    textDecoration: "none",
                                    color: "var(--dashboard-heading)",
                                    padding: "6px 12px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(96,165,250,0.24)",
                                    background: "rgba(37,99,235,0.12)",
                                }}
                            >
                                <span style={{
                                    minWidth: 24,
                                    height: 24,
                                    borderRadius: 999,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 800,
                                }}>
                                    {lineCount}
                                </span>
                                <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                                    <span style={{ fontSize: 11, color: "#bfdbfe", fontWeight: 700 }}>Sepet</span>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{total.toLocaleString("tr-TR")} TL</span>
                                </span>
                            </Link>
                        )}
                        <Link
                            className="dashboard-shell__user-chip"
                            href="/dashboard/settings?tab=abonelik"
                            title="Abonelik bilgilerini ac"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                textDecoration: "none",
                                color: "var(--dashboard-heading)",
                                padding: "6px 10px 6px 6px",
                                borderRadius: 999,
                                border: "1px solid var(--dashboard-border-color)",
                                background: "var(--dashboard-panel-alt-bg)",
                            }}
                        >
                            <span
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    fontWeight: 800,
                                    letterSpacing: 0.6,
                                    color: "#fff",
                                    background: "linear-gradient(135deg, #ef4444, #f97316)",
                                    boxShadow: "0 8px 20px rgba(239,68,68,0.28)",
                                }}
                            >
                                {userInitials}
                            </span>
                            <span className="dashboard-shell__user-meta" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dashboard-heading)" }}>{userName}</span>
                                <span style={{ fontSize: 11, color: "var(--dashboard-text-secondary)" }}>Abonelik Bilgileri</span>
                            </span>
                        </Link>
                        <button
                            className="dashboard-shell__logout-button"
                            onClick={handleLogout}
                            style={{ background: "transparent", border: "1px solid var(--dashboard-border-strong)", cursor: "pointer", color: "var(--dashboard-heading)", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}
                        >
                            Çıkış
                        </button>
                    </div>
                </nav>
            </header>

            <button
                type="button"
                aria-label="Menüyü kapat"
                className={`dashboard-shell__backdrop${mobileMenuOpen ? " is-visible" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* ── Fixed Sidebar ──────────────────────────── */}
            <aside
                className={`dashboard-shell__sidebar${mobileMenuOpen ? " is-open" : ""}`}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: SIDEBAR_W,
                    background: "var(--dashboard-shell-bg)",
                    borderRight: "1px solid var(--dashboard-border-color)",
                    zIndex: 50,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    padding: "0 16px 24px",
                }}
            >
                {/* Sidebar logo */}
                <div style={{ padding: "20px 8px 16px", borderBottom: "1px solid var(--dashboard-border-color)", marginBottom: 16 }}>
                    <a href="/">
                        <Logo variant="dark" size="sm" />
                    </a>
                </div>

                <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 16px",
                                    borderRadius: 12,
                                    color: isActive ? "#fff" : "var(--dashboard-nav-text)",
                                    background: isActive
                                        ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                                        : "transparent",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    textDecoration: "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "14px 16px",
                            borderRadius: 12,
                            color: "#f87171",
                            background: "transparent",
                            border: "none",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            textAlign: "left",
                            width: "100%",
                        }}
                    >
                        <LogOut size={18} />
                        Çıkış
                    </button>
                </nav>

                <div className="dashboard-shell__mobile-links" style={{ display: "none", borderTop: "1px solid var(--dashboard-border-color)", marginTop: 18, paddingTop: 18 }}>
                    <div style={{ color: "var(--dashboard-text-secondary)", fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 10 }}>
                        Site Baglantilari
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <a href="/#home" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 14 }}>AnaSayfa</a>
                        <a href="/#about" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 14 }}>Hakkimizda</a>
                        <a href="/plans-preview" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 14 }}>Fiyatlandirma</a>
                        <a href="/#contact" style={{ color: "var(--dashboard-heading)", textDecoration: "none", fontSize: 14 }}>Iletisim</a>
                    </div>
                </div>

                {/* Premium card */}
                <div
                    style={{
                        marginTop: 24,
                        borderRadius: 16,
                        border: "1px solid rgba(239,68,68,0.2)",
                        background:
                            "linear-gradient(135deg, rgba(127,29,29,0.22), var(--dashboard-panel-bg))",
                        padding: 16,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #facc15, #f97316)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Crown size={16} color="#fff" />
                        </div>
                        <div>
                            <div style={{ color: "var(--dashboard-heading)", fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
                                Premium'a Geç
                            </div>
                            <div style={{ color: "var(--dashboard-text-secondary)", fontSize: 11 }}>
                                Tüm özelliklerin kilidini açın.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setContactOpen(true)}
                        style={{
                            marginTop: 12,
                            width: "100%",
                            borderRadius: 12,
                            background: "var(--dashboard-panel-alt-bg)",
                            color: "var(--dashboard-heading)",
                            fontWeight: 600,
                            padding: "10px 0",
                            border: "1px solid var(--dashboard-border-color)",
                            cursor: "pointer",
                            transition: "background 0.2s",
                        }}
                    >
                        Yükselt
                    </button>
                </div>
            </aside>

            {/* ── Scrollable main area ──────────────────── */}
            <div
                className="dashboard-shell__main"
                style={{
                    marginLeft: SIDEBAR_W,
                    width: `calc(100% - ${SIDEBAR_W}px)`,
                    paddingTop: HEADER_H,
                    minHeight: "100vh",
                    background: "var(--dashboard-shell-surface)",
                    display: "flex",
                    flexDirection: "column",
                    overflowX: "hidden",
                }}
            >


                {/* Dashboard content */}
                <div className="dashboard-shell__content" style={{ flex: 1, padding: 0 }}>
                    {children}
                </div>

                {/* ── Newsletter ─────────────────────────────── */}
                <section className="newsletter-two">
                    <div className="newsletter-two__shape-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/images/shapes/newsletter-two-shape-1.png" alt="" />
                    </div>
                    <div className="newsletter-two__shape-2 float-bob-x">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/images/shapes/newsletter-two-shape-2.png" alt="" />
                    </div>
                    <div className="container">
                        <div className="newsletter-two__inner">
                            <div className="newsletter-two__left">
                                <h2 className="newsletter-two__title">Bültenimize Abone Olun</h2>
                                <p className="newsletter-two__text">
                                    Ürün güncellemeleri ve duyuruları e-posta kutunuza gelsin.
                                </p>
                            </div>
                            <div className="newsletter-two__right">
                                <form className="newsletter-two__form" onSubmit={(e) => e.preventDefault()}>
                                    <div className="newsletter-two__input">
                                        <input type="email" name="email" placeholder="E-posta adresinizi girin" required />
                                    </div>
                                    <button type="submit" className="thm-btn">
                                        Şimdi Abone Ol <span className="icon-right-arrow"></span>
                                    </button>
                                    <div className="checked-box">
                                        <input type="checkbox" name="skipper1" id="skipper-dash" defaultChecked />
                                        <label htmlFor="skipper-dash">
                                            <span></span>Abone olarak Gizlilik Politikamızı kabul etmiş olursunuz.
                                        </label>
                                    </div>
                                    <div className="result"></div>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ─────────────────────────────────── */}
                <footer className="site-footer-two">
                    <div className="site-footer-two__bottom">
                        <div className="container">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="site-footer-two__bottom-inner text-center">
                                        <div className="site-footer-two__copyright">
                                            <p className="site-footer-two__copyright-text">
                                                © 2026 Soru-Yorum. Tüm hakları{" "}
                                                <a href="https://www.keypadsistem.com">
                                                    Keypad Sistem İletişim Bilişim Turz. Tic. Ltd. Şti.
                                                </a>{" "}
                                                tarafından saklıdır.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>{/* end scrollable main area */}
            <style jsx global>{`
                .dashboard-shell__backdrop {
                    position: fixed;
                    inset: 0;
                    border: 0;
                    background: rgba(3, 7, 18, 0.58);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    z-index: 45;
                }

                .dashboard-shell__mobile-links {
                    display: none;
                }

                @media (max-width: 1024px) {
                    .dashboard-shell__header {
                        left: 0 !important;
                    }

                    .dashboard-shell__main {
                        margin-left: 0 !important;
                        width: 100% !important;
                    }

                    .dashboard-shell__sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.22s ease;
                        box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
                    }

                    .dashboard-shell__sidebar.is-open {
                        transform: translateX(0);
                    }

                    .dashboard-shell__backdrop.is-visible {
                        opacity: 1;
                        pointer-events: auto;
                    }

                    .dashboard-shell__mobile-toggle {
                        display: inline-flex !important;
                        align-items: center;
                        justify-content: center;
                        width: 42px;
                        height: 42px;
                        border-radius: 12px;
                        border: 1px solid var(--dashboard-border-color);
                        background: var(--dashboard-panel-alt-bg);
                    }

                    .dashboard-shell__desktop-links {
                        display: none !important;
                    }

                    .dashboard-shell__mobile-links {
                        display: block !important;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard-shell__topnav {
                        padding: 0 14px !important;
                        height: 64px !important;
                    }

                    .dashboard-shell__header-left,
                    .dashboard-shell__header-actions {
                        gap: 8px !important;
                    }

                    .dashboard-shell__user-chip {
                        padding: 4px 6px 4px 4px !important;
                    }

                    .dashboard-shell__cart-chip {
                        padding: 6px 10px !important;
                    }

                    .dashboard-shell__user-chip > span:first-child {
                        width: 34px !important;
                        height: 34px !important;
                        font-size: 12px !important;
                    }

                    .dashboard-shell__user-meta {
                        display: none !important;
                    }

                    .dashboard-shell__cart-chip span:last-child {
                        display: none !important;
                    }

                    .dashboard-shell__logout-button {
                        padding: 8px 12px !important;
                        font-size: 13px !important;
                    }

                    .dashboard-shell__sidebar {
                        width: min(84vw, 320px) !important;
                        padding-bottom: 18px !important;
                    }

                    .dashboard-shell__main {
                        padding-top: 64px !important;
                    }
                }

                @media (max-width: 480px) {
                    .dashboard-shell__topnav {
                        padding: 0 10px !important;
                    }

                    .dashboard-shell__logout-button {
                        padding: 8px 10px !important;
                    }
                }
            `}</style>

            <UpgradeContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
        </div>
    );
}
