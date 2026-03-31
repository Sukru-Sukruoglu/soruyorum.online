"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    Users,
    Wifi,
    WifiOff,
    Globe,
    Monitor,
    Smartphone,
    Clock,
    RefreshCw,
    Radio,
    Building2,
    CalendarCheck,
    Calendar,
    ChevronDown,
    ChevronRight,
    UserCheck,
    Mail,
    Shield,
    Eye,
    MapPin,
} from "lucide-react";
import { trpc } from "../../../../utils/trpc";
import { isSuperAdminRole } from "../../../../utils/auth";
import { fetchPortalAuthSession } from "../../../../utils/authSession";

/* ── Helpers ── */
function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}g ${h}s ${m}dk`;
    if (h > 0) return `${h}s ${m}dk`;
    return `${m}dk`;
}

function timeAgo(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat önce`;
    return `${Math.floor(hrs / 24)} gün önce`;
}

function getDeviceIcon(ua: string) {
    const lower = (ua || "").toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
        return Smartphone;
    }
    return Monitor;
}

function getBrowserName(ua: string): string {
    const lower = (ua || "").toLowerCase();
    if (lower.includes("chrome") && !lower.includes("edg")) return "Chrome";
    if (lower.includes("firefox")) return "Firefox";
    if (lower.includes("safari") && !lower.includes("chrome")) return "Safari";
    if (lower.includes("edg")) return "Edge";
    if (lower.includes("opera") || lower.includes("opr")) return "Opera";
    return "Bilinmeyen";
}

function getPageName(path: string): string {
    const pageMap: Record<string, string> = {
        "/": "Ana Sayfa",
        "/login": "Giriş Sayfası",
        "/register": "Kayıt Sayfası",
        "/dashboard": "Dashboard",
        "/dashboard/stats": "İstatistikler",
        "/dashboard/reports": "Raporlar",
        "/dashboard/settings": "Ayarlar",
        "/dashboard/workspace": "Çalışma Alanı",
        "/dashboard/users": "Kullanıcı Yönetimi",
        "/dashboard/monitoring": "Canlı İzleme",
    };
    if (pageMap[path]) return pageMap[path];
    if (path.startsWith("/dashboard/events/")) return "Etkinlik Detayı";
    if (path.startsWith("/live/")) return "Canlı Etkinlik";
    if (path.startsWith("/join")) return "Katılım Sayfası";
    if (path.startsWith("/presentation/")) return "Sunum Ekranı";
    return path;
}

function durationSince(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}sn`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}dk`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}s ${mins % 60}dk`;
}

function formatLocation(geo?: { city?: string | null; region?: string | null; country?: string | null; source?: string | null } | null): string {
    if (!geo) return "Konum yok";
    if (geo.source === "private") return "Yerel / özel IP";
    const parts = [geo.city, geo.region, geo.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Konum yok";
}

function formatActionLabel(action: string, resource: string): string {
    const normalizedAction = (action || "").replace(/_/g, " ").trim();
    const normalizedResource = (resource || "").replace(/_/g, " ").trim();
    return `${normalizedAction || "işlem"} / ${normalizedResource || "kaynak"}`;
}

function summarizeDetails(details: Record<string, unknown> | null | undefined): string {
    if (!details) return "—";
    const importantKeys = ["email", "name", "slug", "eventId", "organizationId", "targetUserId"];
    for (const key of importantKeys) {
        const value = details[key];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }

    const firstEntry = Object.entries(details).find(([, value]) => typeof value === "string" || typeof value === "number");
    if (!firstEntry) return "—";
    return `${firstEntry[0]}: ${String(firstEntry[1])}`;
}

/* ── Stat Card ── */
function StatCard({
    icon: Icon,
    label,
    value,
    color,
    sub,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    sub?: string;
}) {
    return (
        <div
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "24px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all .2s",
            }}
        >
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon size={24} color="#fff" />
            </div>
            <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</div>
                {sub && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{sub}</div>
                )}
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function ActiveUsersPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

    useEffect(() => {
        void fetchPortalAuthSession()
            .then((session) => {
                setRole(session.role);
                if (!session.authenticated) {
                    router.replace("/login");
                    return;
                }
                if (!isSuperAdminRole(session.role)) {
                    router.replace("/dashboard");
                }
            })
            .catch(() => {
                setRole(null);
                router.replace("/login");
            });
    }, [router]);

    const { data, isLoading, refetch, dataUpdatedAt } = trpc.dashboard.getActiveUsers.useQuery(
        undefined,
        {
            enabled: isSuperAdminRole(role),
            refetchInterval: autoRefresh ? 5000 : false,
            refetchOnWindowFocus: true,
        }
    );

    const toggleRoom = useCallback((room: string) => {
        setExpandedRooms((prev) => {
            const next = new Set(prev);
            if (next.has(room)) next.delete(room);
            else next.add(room);
            return next;
        });
    }, []);

    /* ── Styles ── */
    const cardBg = "rgba(255,255,255,0.03)";
    const borderColor = "rgba(255,255,255,0.08)";

    if (isLoading && !data) {
        return (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                <RefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: 12 }}>Veriler yükleniyor...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const live = data?.live;
    const platform = data?.platform;
    const onlineUsers = data?.onlineUsers ?? [];
    const visitors = data?.visitors?.list ?? [];
    const recentActivity = data?.recentActivity ?? [];
    const ipActivity = data?.ipActivity ?? [];
    const homepageVisitors = visitors.filter((visitor: any) => visitor.page === "/");

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* ── Header ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <Activity size={28} color="#22d3ee" />
                        Canlı İzleme
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                        Platform üzerindeki aktif bağlantıları gerçek zamanlı izleyin
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Auto refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: `1px solid ${autoRefresh ? "rgba(34,211,238,0.4)" : borderColor}`,
                            background: autoRefresh ? "rgba(34,211,238,0.1)" : "transparent",
                            color: autoRefresh ? "#22d3ee" : "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                            transition: "all .2s",
                        }}
                    >
                        <Radio size={14} />
                        {autoRefresh ? "Otomatik (5sn)" : "Otomatik Kapalı"}
                    </button>
                    {/* Manual refresh */}
                    <button
                        onClick={() => refetch()}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: `1px solid ${borderColor}`,
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                        }}
                    >
                        <RefreshCw size={14} />
                        Yenile
                    </button>
                    {/* Last updated */}
                    {dataUpdatedAt > 0 && (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                            Son: {new Date(dataUpdatedAt).toLocaleTimeString("tr-TR")}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 32,
                }}
            >
                <StatCard
                    icon={UserCheck}
                    label="Oturum Açık"
                    value={onlineUsers.length}
                    color="linear-gradient(135deg, #f472b6, #db2777)"
                    sub="aktif oturum"
                />
                <StatCard
                    icon={Wifi}
                    label="Canlı Bağlantı"
                    value={live?.totalConnections ?? 0}
                    color="linear-gradient(135deg, #22d3ee, #0891b2)"
                    sub={`${live?.rooms.length ?? 0} aktif oda`}
                />
                <StatCard
                    icon={Users}
                    label="Toplam Kullanıcı"
                    value={platform?.totalUsers ?? 0}
                    color="linear-gradient(135deg, #a78bfa, #7c3aed)"
                />
                <StatCard
                    icon={Building2}
                    label="Toplam Organizasyon"
                    value={platform?.totalOrgs ?? 0}
                    color="linear-gradient(135deg, #fb923c, #ea580c)"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Aktif Etkinlik"
                    value={platform?.activeEvents ?? 0}
                    color="linear-gradient(135deg, #34d399, #059669)"
                    sub={`${platform?.totalEvents ?? 0} toplam`}
                />
                <StatCard
                    icon={Eye}
                    label="Ziyaretçi"
                    value={visitors.length}
                    color="linear-gradient(135deg, #fbbf24, #d97706)"
                    sub="aktif sayfa görüntülenme"
                />
                <StatCard
                    icon={Globe}
                    label="Ana Sayfa Aktif"
                    value={homepageVisitors.length}
                    color="linear-gradient(135deg, #60a5fa, #2563eb)"
                    sub="/ sayfasını izleyenler"
                />
            </div>

            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Globe size={18} color="#60a5fa" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            Ana Sayfa Aktif Ziyaretçiler
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {homepageVisitors.length} kişi
                    </span>
                </div>

                {homepageVisitors.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Cihaz</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Tarayıcı</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Aktif Süre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homepageVisitors.map((visitor: any) => {
                                    const DeviceIcon = getDeviceIcon(visitor.ua);
                                    return (
                                        <tr
                                            key={visitor.visitorId}
                                            style={{
                                                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                                transition: "background .15s",
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)" }}>
                                                    <DeviceIcon size={16} />
                                                    {visitor.ua?.toLowerCase().includes("mobile") ? "Mobil" : "Masaüstü"}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)" }}>
                                                {getBrowserName(visitor.ua)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                {visitor.ip}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.55)" }}>
                                                {formatLocation(visitor.geo)}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Clock size={12} />
                                                    {durationSince(visitor.firstSeen)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: 36,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                        }}
                    >
                        <Globe size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Şu an anasayfada aktif ziyaretçi yok</p>
                    </div>
                )}
            </div>

            {/* ── Online Users ── */}
            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <UserCheck size={18} color="#f472b6" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            Oturum Açmış Kullanıcılar
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {onlineUsers.length} kullanıcı
                    </span>
                </div>

                {onlineUsers.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Kullanıcı</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>E-posta</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Rol</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Organizasyon</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Son Aksiyon</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP / Konum</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Oturum Bitiş</th>
                                </tr>
                            </thead>
                            <tbody>
                                {onlineUsers.map((user) => {
                                    const roleBg = user.role === "superadmin" || user.role === "admin" || user.role === "junioradmin"
                                        ? "rgba(239,68,68,0.15)"
                                        : "rgba(34,211,238,0.1)";
                                    const roleColor = user.role === "superadmin" || user.role === "admin" || user.role === "junioradmin"
                                        ? "#f87171"
                                        : "#22d3ee";
                                    const roleLabel = user.role === "superadmin" ? "Süper Admin"
                                        : user.role === "admin" ? "Admin"
                                            : user.role === "junioradmin" ? "Junior Admin"
                                                : user.role === "organizer" ? "Organizatör"
                                                    : user.role;

                                    return (
                                        <tr
                                            key={user.userId}
                                            style={{
                                                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                                transition: "background .15s",
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: "50%",
                                                            background: user.avatarUrl
                                                                ? `url(${user.avatarUrl}) center/cover`
                                                                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#fff",
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {!user.avatarUrl && (user.name?.[0]?.toUpperCase() || "?")}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: "#fff" }}>
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)" }}>
                                                    <Mail size={14} />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span
                                                    style={{
                                                        padding: "3px 10px",
                                                        borderRadius: 6,
                                                        background: roleBg,
                                                        border: `1px solid ${roleColor}33`,
                                                        fontSize: 12,
                                                        color: roleColor,
                                                        fontWeight: 500,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    <Shield size={11} />
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)" }}>
                                                {user.organizationName || "—"}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {user.lastAction ? (
                                                    <div>
                                                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 12 }}>
                                                            {formatActionLabel(user.lastAction.action, user.lastAction.resource)}
                                                        </div>
                                                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
                                                            {timeAgo(user.lastAction.createdAt)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Kayıt yok</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {user.lastAction?.ipAddress ? (
                                                    <div>
                                                        <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                                                            {user.lastAction.ipAddress}
                                                        </div>
                                                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
                                                            {formatLocation(user.lastAction.geo)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>IP yok</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                                                {new Date(user.sessionExpiresAt).toLocaleString("tr-TR")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: 48,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                        }}
                    >
                        <Users size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Şu an oturum açmış kullanıcı bulunmuyor</p>
                    </div>
                )}
            </div>

            {/* ── Active Visitors ── */}
            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Eye size={18} color="#fbbf24" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            Aktif Ziyaretçiler
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {visitors.length} ziyaretçi
                    </span>
                </div>

                {visitors.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <MapPin size={13} />
                                            Sayfa
                                        </div>
                                    </th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Cihaz</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Tarayıcı</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Referrer</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Süre</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitors.map((v: any) => {
                                    const DeviceIcon = getDeviceIcon(v.ua);
                                    return (
                                        <tr
                                            key={v.visitorId}
                                            style={{
                                                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                                transition: "background .15s",
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            <td style={{ padding: "12px 16px" }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: "#fbbf24", fontSize: 13 }}>
                                                        {getPageName(v.page)}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, fontFamily: "monospace" }}>
                                                        {v.page}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)" }}>
                                                    <DeviceIcon size={16} />
                                                    {v.ua?.toLowerCase().includes("mobile") ? "Mobil" : "Masaüstü"}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)" }}>
                                                {getBrowserName(v.ua)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                {v.ip}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.55)" }}>
                                                {formatLocation(v.geo)}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", maxWidth: 220 }}>
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={v.referrer || ""}>
                                                    {v.referrer || "—"}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Clock size={12} />
                                                    {durationSince(v.firstSeen)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: 48,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                        }}
                    >
                        <Eye size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Şu an aktif ziyaretçi bulunmuyor</p>
                    </div>
                )}
            </div>

            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Activity size={18} color="#34d399" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            Son Kullanıcı Aktiviteleri
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {recentActivity.length} kayıt
                    </span>
                </div>

                {recentActivity.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Zaman</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Kullanıcı</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Aksiyon</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Detay</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.map((item) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                            transition: "background .15s",
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                    >
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                                            <div>{new Date(item.createdAt).toLocaleString("tr-TR")}</div>
                                            <div style={{ marginTop: 2 }}>{timeAgo(item.createdAt)}</div>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ color: "#fff", fontWeight: 600 }}>
                                                {item.user?.name || "Sistem"}
                                            </div>
                                            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>
                                                {item.user?.email || item.organization?.name || "—"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>
                                            {formatActionLabel(item.action, item.resource)}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", maxWidth: 220 }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={summarizeDetails(item.details)}>
                                                {summarizeDetails(item.details)}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                                            {item.ipAddress || "—"}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                                            {formatLocation(item.geo)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                        <Activity size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Henüz kullanıcı aktivite kaydı yok</p>
                    </div>
                )}
            </div>

            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <MapPin size={18} color="#f59e0b" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            IP Aktivite Ozeti
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {ipActivity.length} IP
                    </span>
                </div>

                {ipActivity.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Ziyaretci</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Socket</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Aksiyon</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Kullanicilar</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Son Gorulme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ipActivity.map((item) => (
                                    <tr
                                        key={item.ip}
                                        style={{
                                            borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                            transition: "background .15s",
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                    >
                                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                                            {item.ip}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                                            {formatLocation(item.geo)}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#fbbf24", fontWeight: 600 }}>
                                            {item.activeVisitors}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#22d3ee", fontWeight: 600 }}>
                                            {item.liveConnections}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#34d399", fontWeight: 600 }}>
                                            {item.recentActions}
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", maxWidth: 220 }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.users.join(", ")}>
                                                {item.users.length > 0 ? item.users.join(", ") : "—"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                                            {item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString("tr-TR") : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                        <MapPin size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>IP aktivite ozeti henuz olusmadi</p>
                    </div>
                )}
            </div>

            {/* ── Active Rooms ── */}
            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    marginBottom: 24,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <Globe size={18} color="#22d3ee" />
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                        Aktif Etkinlik Odaları
                    </h2>
                    {live?.rooms.length === 0 && (
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>
                            — Şu an aktif oda yok
                        </span>
                    )}
                </div>

                {(live?.rooms ?? []).map((room) => {
                    const isExpanded = expandedRooms.has(room.room);
                    const roomConnections = (live?.connections ?? []).filter((c) =>
                        c.rooms.includes(room.room)
                    );

                    return (
                        <div key={room.room} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <button
                                onClick={() => toggleRoom(room.room)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "16px 24px",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#fff",
                                    textAlign: "left",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    {isExpanded ? (
                                        <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
                                    ) : (
                                        <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                                    )}
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                            {room.eventTitle}
                                        </div>
                                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                                            {room.room}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "4px 12px",
                                        borderRadius: 20,
                                        background: "rgba(34,211,238,0.1)",
                                        border: "1px solid rgba(34,211,238,0.2)",
                                    }}
                                >
                                    <Users size={14} color="#22d3ee" />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#22d3ee" }}>
                                        {room.count}
                                    </span>
                                </div>
                            </button>

                            {isExpanded && roomConnections.length > 0 && (
                                <div style={{ padding: "0 24px 16px", paddingLeft: 52 }}>
                                    <div
                                        style={{
                                            background: "rgba(0,0,0,0.2)",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Cihaz</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Tarayıcı</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Bağlandı</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roomConnections.map((conn) => {
                                                    const DeviceIcon = getDeviceIcon(conn.userAgent);
                                                    return (
                                                        <tr
                                                            key={conn.id}
                                                            style={{
                                                                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                                            }}
                                                        >
                                                            <td style={{ padding: "10px 14px" }}>
                                                                <DeviceIcon size={16} color="rgba(255,255,255,0.6)" />
                                                            </td>
                                                            <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.7)" }}>
                                                                {getBrowserName(conn.userAgent)}
                                                            </td>
                                                            <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 12 }}>
                                                                {conn.address}
                                                            </td>
                                                            <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.45)" }}>
                                                                {formatLocation(conn.geo)}
                                                            </td>
                                                            <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                    <Clock size={12} />
                                                                    {timeAgo(conn.connectedAt)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {(live?.rooms ?? []).length === 0 && (
                    <div
                        style={{
                            padding: 48,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                        }}
                    >
                        <WifiOff size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Şu an aktif etkinlik odası bulunmuyor</p>
                    </div>
                )}
            </div>

            {/* ── All Connections ── */}
            <div
                style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    marginBottom: 24,
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Wifi size={18} color="#22d3ee" />
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                            Tüm Bağlantılar
                        </h2>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {live?.totalConnections ?? 0} bağlantı
                    </span>
                </div>

                {(live?.connections ?? []).length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Socket ID</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Cihaz</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>IP Adres</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Konum</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Odalar</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Bağlantı</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(live?.connections ?? []).map((conn) => {
                                    const DeviceIcon = getDeviceIcon(conn.userAgent);
                                    return (
                                        <tr
                                            key={conn.id}
                                            style={{
                                                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                                transition: "background .15s",
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                                                {conn.id.slice(0, 12)}...
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)" }}>
                                                    <DeviceIcon size={16} />
                                                    {getBrowserName(conn.userAgent)}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                {conn.address}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)" }}>
                                                {formatLocation(conn.geo)}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {conn.rooms.length > 0 ? (
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {conn.rooms.map((r) => (
                                                            <span
                                                                key={r}
                                                                style={{
                                                                    padding: "2px 8px",
                                                                    borderRadius: 6,
                                                                    background: "rgba(34,211,238,0.1)",
                                                                    border: "1px solid rgba(34,211,238,0.2)",
                                                                    fontSize: 11,
                                                                    color: "#22d3ee",
                                                                }}
                                                            >
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>
                                                {timeAgo(conn.connectedAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: 48,
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                        }}
                    >
                        <WifiOff size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>Şu an aktif bağlantı bulunmuyor</p>
                    </div>
                )}
            </div>

            {/* ── WS Server Info ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 24,
                    padding: "16px 0",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 12,
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} />
                    WS Uptime: {live?.wsUptime ? formatUptime(live.wsUptime) : "—"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} />
                    {data?.timestamp ? new Date(data.timestamp).toLocaleString("tr-TR") : "—"}
                </span>
            </div>
        </div>
    );
}
