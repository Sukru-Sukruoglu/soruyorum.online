"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    Building2,
    CalendarClock,
    CheckCircle,
    ChevronRight,
    Clock3,
    Mail,
    Phone,
    Search,
    Shield,
    Sparkles,
    Trash2,
    UserCircle2,
    X,
    XCircle,
} from "lucide-react";
import { trpc } from "../../../../utils/trpc";
import { isSuperAdminRole } from "../../../../utils/auth";
import { fetchPortalAuthSession } from "../../../../utils/authSession";

function formatDate(value: string | Date) {
    try {
        const d = typeof value === "string" ? new Date(value) : value;
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(d);
    } catch {
        return "-";
    }
}

function formatDuration(ms: number | null | undefined) {
    if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) {
        return "-";
    }

    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];

    if (days > 0) parts.push(`${days}g`);
    if (hours > 0) parts.push(`${hours}sa`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}dk`);

    return parts.slice(0, 3).join(" ");
}

function formatRelativeTime(value: string | Date | null | undefined) {
    if (!value) return "-";

    try {
        const date = typeof value === "string" ? new Date(value) : value;
        const diffMs = Date.now() - date.getTime();
        if (!Number.isFinite(diffMs)) return "-";
        if (diffMs < 60_000) return "az once";
        if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} dk once`;
        if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} sa once`;
        return `${Math.floor(diffMs / 86_400_000)} g once`;
    } catch {
        return "-";
    }
}

function formatAuditAction(action: string, resource: string) {
    const normalizedAction = action.replace(/[_\.]+/g, " ").trim() || "islem";
    const normalizedResource = resource.replace(/[_\.]+/g, " ").trim() || "kayit";
    return `${normalizedAction} / ${normalizedResource}`;
}

function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
        return "-";
    }

    const normalizedAmount = amount > 1000 ? amount / 100 : amount;

    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            maximumFractionDigits: 2,
        }).format(normalizedAmount);
    } catch {
        return `${normalizedAmount} ${currency || "TRY"}`;
    }
}

export default function UsersPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
    const [pilotActionMessage, setPilotActionMessage] = useState<string | null>(null);

    useEffect(() => {
        void fetchPortalAuthSession()
            .then((session) => {
                setRole(session.role);
                setCurrentUserEmail(session.email);
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

    const utils = trpc.useUtils();
    const { data, isLoading, error } = trpc.users.list.useQuery(undefined, {
        enabled: isSuperAdminRole(role),
        retry: false,
    });

    const deleteMutation = trpc.users.delete.useMutation({
        onSuccess: () => {
            utils.users.list.invalidate();
            utils.users.detail.invalidate();
            setDeleteConfirm(null);
            setSelectedUserId((current) => (current === deleteConfirm ? null : current));
        },
    });
    const updateRoleMutation = trpc.users.updateRole.useMutation({
        onSuccess: () => {
            setRoleUpdateError(null);
            utils.users.list.invalidate();
            utils.users.detail.invalidate();
        },
        onError: (err) => {
            setRoleUpdateError(err.message);
        },
    });
    const assignSpringPilotMutation = trpc.users.assignSpringPilot.useMutation({
        onSuccess: () => {
            setPilotActionMessage("Spring Pilot 500 plani organizasyona atandi.");
            utils.users.list.invalidate();
            utils.users.detail.invalidate();
        },
        onError: (err) => {
            setPilotActionMessage(err.message);
        },
    });

    const selectedUser = useMemo(
        () => (data ?? []).find((entry) => entry.id === selectedUserId) ?? null,
        [data, selectedUserId],
    );

    const userDetailQuery = trpc.users.detail.useQuery(
        { userId: selectedUserId ?? "00000000-0000-0000-0000-000000000000" },
        {
            enabled: Boolean(selectedUserId) && isSuperAdminRole(role),
            retry: false,
        },
    );

    const handleDelete = (userId: string) => {
        deleteMutation.mutate({ userId });
    };

    const handleRoleChange = (userId: string, nextRole: string) => {
        setRoleUpdateError(null);
        updateRoleMutation.mutate({
            userId,
            role: nextRole as "superadmin" | "junioradmin" | "admin" | "organizer" | "moderator" | "member",
        });
    };

    const handleAssignSpringPilot = (userId: string) => {
        setPilotActionMessage(null);
        assignSpringPilotMutation.mutate({ userId });
    };

    const roleOptions: Array<{
        value: "superadmin" | "junioradmin" | "admin" | "organizer" | "moderator" | "member";
        label: string;
    }> = [
        { value: "superadmin", label: "Süper Admin" },
        { value: "junioradmin", label: "Junior Admin" },
        { value: "admin", label: "Admin" },
        { value: "organizer", label: "Organizatör" },
        { value: "moderator", label: "Moderatör" },
        { value: "member", label: "Üye" },
    ];
    const roleComparisonRows: Array<{
        role: string;
        adminPanel: boolean;
        roleEdit: boolean;
        bypassPlanLimits: boolean;
        eventManagement: boolean;
        moderation: boolean;
        note: string;
    }> = [
        {
            role: "superadmin",
            adminPanel: true,
            roleEdit: true,
            bypassPlanLimits: true,
            eventManagement: true,
            moderation: true,
            note: "En yüksek yetki, sistem genelinde tam erişim.",
        },
        {
            role: "junioradmin",
            adminPanel: false,
            roleEdit: false,
            bypassPlanLimits: true,
            eventManagement: true,
            moderation: true,
            note: "Güçlü operasyon rolü; plan/abonelik limitlerini aşabilir.",
        },
        {
            role: "admin",
            adminPanel: false,
            roleEdit: false,
            bypassPlanLimits: false,
            eventManagement: true,
            moderation: true,
            note: "Organizasyon düzeyinde yönetim odaklı rol.",
        },
        {
            role: "organizer",
            adminPanel: false,
            roleEdit: false,
            bypassPlanLimits: false,
            eventManagement: true,
            moderation: true,
            note: "Etkinlik sahibi/operasyon rolü.",
        },
        {
            role: "moderator",
            adminPanel: false,
            roleEdit: false,
            bypassPlanLimits: false,
            eventManagement: false,
            moderation: true,
            note: "Canlı akışta moderasyon ve içerik yönetimi.",
        },
        {
            role: "member",
            adminPanel: false,
            roleEdit: false,
            bypassPlanLimits: false,
            eventManagement: false,
            moderation: false,
            note: "Temel kullanıcı seviyesi, sınırlı yetki.",
        },
    ];

    const yesNoIcon = (value: boolean) =>
        value ? (
            <CheckCircle size={15} className="text-emerald-300" />
        ) : (
            <XCircle size={15} className="text-rose-300/85" />
        );

    const filtered = useMemo(() => {
        const users = data ?? [];
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const orgName = u.organizations?.name ?? "";
            return (
                (u.email ?? "").toLowerCase().includes(q) ||
                (u.name ?? "").toLowerCase().includes(q) ||
                (u.role ?? "").toLowerCase().includes(q) ||
                (u.phone ?? "").toLowerCase().includes(q) ||
                (u.company ?? "").toLowerCase().includes(q) ||
                orgName.toLowerCase().includes(q)
            );
        });
    }, [data, query]);

    return (
        <>
        <div className="space-y-8 py-4">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                    <h2 className="text-base font-semibold text-white">Rol Yetki Karşılaştırması</h2>
                    <p className="mt-1 text-sm text-white/55">
                        Roller için sistemdeki mevcut yetki davranışlarının özet görünümü.
                    </p>
                </div>
                <div className="overflow-x-auto px-2 pb-2 pt-2 sm:px-3 lg:px-4 xl:px-5 sm:pb-3 lg:pb-4">
                    <table className="w-full min-w-[980px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
                        <thead className="bg-white/[0.04]">
                            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3 text-center">Yönetim Paneli</th>
                                <th className="px-4 py-3 text-center">Rol Düzenleme</th>
                                <th className="px-4 py-3 text-center">Plan Limiti Bypass</th>
                                <th className="px-4 py-3 text-center">Etkinlik Yönetimi</th>
                                <th className="px-4 py-3 text-center">Moderasyon</th>
                                <th className="px-4 py-3">Açıklama</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {roleComparisonRows.map((row) => (
                                <tr key={row.role} className="align-top transition hover:bg-white/[0.03]">
                                    <td className="px-4 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                row.role === "superadmin"
                                                    ? "border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200"
                                                    : row.role === "junioradmin"
                                                      ? "border border-sky-400/20 bg-sky-500/10 text-sky-200"
                                                      : "border border-white/10 bg-white/10 text-white/75"
                                            }`}
                                        >
                                            {row.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">{yesNoIcon(row.adminPanel)}</td>
                                    <td className="px-4 py-4 text-center">{yesNoIcon(row.roleEdit)}</td>
                                    <td className="px-4 py-4 text-center">{yesNoIcon(row.bypassPlanLimits)}</td>
                                    <td className="px-4 py-4 text-center">{yesNoIcon(row.eventManagement)}</td>
                                    <td className="px-4 py-4 text-center">{yesNoIcon(row.moderation)}</td>
                                    <td className="px-4 py-4 text-sm text-white/70">{row.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-white">Kullanıcılar</h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
                            <Shield size={14} />
                            Sadece Süper Admin
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-white/55">Sisteme kayıt olan kullanıcıları görüntüleyin ve yönetin.</p>
                </div>

                <div className="w-full max-w-xl">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ara: e-posta, isim, rol, telefon, organizasyon..."
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/40 focus:bg-white/10"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="text-sm text-white/60">
                        Toplam: <span className="font-semibold text-white">{filtered.length}</span>
                    </div>
                    <div className="text-sm text-white/45">
                        {isLoading ? "Yükleniyor..." : "Bir kullanıcıya tıklayıp detayları açın"}
                    </div>
                </div>

                {error ? (
                    <div className="p-6 text-sm text-rose-300">Kullanıcılar yüklenemedi: {error.message}</div>
                ) : null}

                <div className="px-2 pb-2 pt-2 sm:px-3 lg:px-4 xl:px-5 sm:pb-3 lg:pb-4">
                    <table className="w-full table-fixed overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
                        <colgroup>
                            <col className="w-[15%]" />
                            <col className="w-[23%]" />
                            <col className="w-[13%]" />
                            <col className="w-[9%]" />
                            <col className="w-[15%]" />
                            <col className="w-[15%]" />
                            <col className="w-[7%]" />
                            <col className="w-[3%]" />
                        </colgroup>
                        <thead className="bg-white/[0.04]">
                            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                                <th className="px-4 py-3">İsim</th>
                                <th className="px-4 py-3">E-posta</th>
                                <th className="px-4 py-3">Telefon</th>
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3">Şirket</th>
                                <th className="px-4 py-3">Organizasyon</th>
                                <th className="px-4 py-3">Kayıt Tarihi</th>
                                <th className="px-4 py-3 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {(filtered ?? []).map((u) => (
                                <tr
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`cursor-pointer align-top transition hover:bg-white/[0.03] ${selectedUserId === u.id ? "bg-white/[0.05]" : ""}`}
                                >
                                    <td className="px-4 py-4 text-sm font-semibold text-white break-words">{u.name || "-"}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex flex-wrap items-center gap-2 text-white/75 break-all">
                                            <Mail
                                                size={14}
                                                className={u.email_verified ? "text-emerald-400" : "text-white/30"}
                                            />
                                            <span className={u.email_verified ? "text-emerald-200" : "text-white/75"}>
                                                {u.email}
                                            </span>
                                            {u.email_verified ? (
                                                <span title="Doğrulanmış">
                                                    <CheckCircle size={14} className="text-emerald-400" />
                                                </span>
                                            ) : (
                                                <span title="Doğrulanmamış">
                                                    <XCircle size={14} className="text-rose-400" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white/75">
                                        {u.phone ? (
                                            <div className="flex flex-wrap items-center gap-2 break-all">
                                                <Phone
                                                    size={14}
                                                    className={u.phone_verified ? "text-emerald-400" : "text-white/30"}
                                                />
                                                <span className={u.phone_verified ? "text-emerald-200" : "text-white/75"}>
                                                    {u.phone}
                                                </span>
                                                {u.phone_verified ? (
                                                    <span title="Doğrulanmış">
                                                        <CheckCircle size={14} className="text-emerald-400" />
                                                    </span>
                                                ) : (
                                                    <span title="Doğrulanmamış">
                                                        <XCircle size={14} className="text-rose-400" />
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-white/30">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <select
                                            value={(u.role || "member").toLowerCase()}
                                            onClick={(event) => event.stopPropagation()}
                                            onChange={(event) => handleRoleChange(u.id, event.target.value)}
                                            disabled={
                                                updateRoleMutation.isPending ||
                                                (currentUserEmail !== null &&
                                                    (u.email || "").toLowerCase() === currentUserEmail.toLowerCase())
                                            }
                                            className={`w-full rounded-xl border px-2 py-1.5 text-[12px] font-semibold outline-none transition ${
                                                isSuperAdminRole(u.role)
                                                    ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100"
                                                    : "border-white/10 bg-white/10 text-white/80"
                                            } disabled:cursor-not-allowed disabled:opacity-60`}
                                            title={
                                                currentUserEmail !== null &&
                                                (u.email || "").toLowerCase() === currentUserEmail.toLowerCase()
                                                    ? "Kendi rolünüzü bu panelden değiştiremezsiniz"
                                                    : "Kullanıcı rolünü güncelle"
                                            }
                                        >
                                            {roleOptions.map((option) => (
                                                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white/70 break-words">{u.company || "-"}</td>
                                    <td className="px-4 py-4 text-sm text-white/70 break-words">{u.organizations?.name || "-"}</td>
                                    <td className="px-4 py-4 text-sm text-white/55">
                                        {formatDate(u.created_at as unknown as string)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {deleteConfirm === u.id ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDelete(u.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {deleteMutation.isPending ? "Siliniyor..." : "Onayla"}
                                                </button>
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setDeleteConfirm(null);
                                                    }}
                                                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/15"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setDeleteConfirm(u.id);
                                                }}
                                                className="rounded-lg p-2 text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filtered.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-white/45" colSpan={8}>
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteMutation.error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                    Hata: {deleteMutation.error.message}
                </div>
            ) : null}
            {roleUpdateError ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Rol güncelleme hatası: {roleUpdateError}
                </div>
            ) : null}
        </div>

        {selectedUserId ? (
            <>
                <button
                    type="button"
                    aria-label="Detay panelini kapat"
                    onClick={() => setSelectedUserId(null)}
                    className="fixed inset-0 z-40 bg-slate-950/72 backdrop-blur-sm"
                />

                <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-white/10 bg-slate-950/96 shadow-[-24px_0_80px_rgba(0,0,0,0.55)]">
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-200/80">
                                <Activity size={14} />
                                Kullanici Detayi
                            </div>
                            <h2 className="mt-2 text-2xl font-bold text-white">
                                {selectedUser?.name || selectedUser?.email || "Kullanıcı"}
                            </h2>
                            <p className="mt-1 text-sm text-white/50">
                                Mevcut sistem kayıtlarına göre profil, oturum ve aktivite özeti
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedUserId(null)}
                            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {userDetailQuery.isLoading ? (
                            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
                                Kullanıcı detayları yükleniyor...
                            </div>
                        ) : null}

                        {userDetailQuery.error ? (
                            <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
                                Detay yüklenemedi: {userDetailQuery.error.message}
                            </div>
                        ) : null}

                        {userDetailQuery.data ? (
                            <div className="space-y-6">
                                {pilotActionMessage ? (
                                    <div className={`rounded-2xl border p-4 text-sm ${assignSpringPilotMutation.error ? "border-amber-400/20 bg-amber-500/10 text-amber-100" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"}`}>
                                        {pilotActionMessage}
                                    </div>
                                ) : null}

                                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Toplam Oturum</div>
                                        <div className="mt-3 text-3xl font-bold text-white">{userDetailQuery.data.stats.totalSessions}</div>
                                        <div className="mt-2 text-sm text-white/45">Kaydedilen oturum adedi</div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Aktif Oturum</div>
                                        <div className="mt-3 text-3xl font-bold text-emerald-200">{userDetailQuery.data.stats.activeSessions}</div>
                                        <div className="mt-2 text-sm text-white/45">Suresi dolmamis oturumlar</div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Audit Kaydi</div>
                                        <div className="mt-3 text-3xl font-bold text-white">{userDetailQuery.data.stats.totalAuditRecords}</div>
                                        <div className="mt-2 text-sm text-white/45">Kullaniciya bagli islem kaydi</div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Olusturulan Event</div>
                                        <div className="mt-3 text-3xl font-bold text-white">{userDetailQuery.data.stats.createdEventsCount}</div>
                                        <div className="mt-2 text-sm text-white/45">Kayitta yaratici bilgisi varsa gorunur</div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Son Gorulen</div>
                                        <div className="mt-3 text-xl font-bold text-white">
                                            {formatRelativeTime(userDetailQuery.data.stats.lastSeenAt as unknown as string | null)}
                                        </div>
                                        <div className="mt-2 text-sm text-white/45">
                                            {userDetailQuery.data.stats.lastSeenAt
                                                ? formatDate(userDetailQuery.data.stats.lastSeenAt as unknown as string)
                                                : "Henuz olculebilir hareket yok"}
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                                        <div className="text-xs uppercase tracking-[0.16em] text-white/35">Sistemde Gecen Sure</div>
                                        <div className="mt-3 text-xl font-bold text-white">
                                            {formatDuration(userDetailQuery.data.stats.accountAgeMs)}
                                        </div>
                                        <div className="mt-2 text-sm text-white/45">Kayit tarihinden bugune gecen toplam sure</div>
                                    </div>
                                </section>

                                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <UserCircle2 size={18} className="text-fuchsia-200" />
                                            Profil
                                        </div>
                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">E-posta</div>
                                                <div className="mt-2 text-sm text-white/80 break-all">{userDetailQuery.data.user.email}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Rol</div>
                                                <div className="mt-2 text-sm text-white/80">{userDetailQuery.data.user.role}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Telefon</div>
                                                <div className="mt-2 text-sm text-white/80">{userDetailQuery.data.user.phone || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Sirket</div>
                                                <div className="mt-2 text-sm text-white/80">{userDetailQuery.data.user.company || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Dil / Tema</div>
                                                <div className="mt-2 text-sm text-white/80">
                                                    {userDetailQuery.data.user.language || "-"} / {userDetailQuery.data.user.theme || "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Saat Dilimi</div>
                                                <div className="mt-2 text-sm text-white/80">{userDetailQuery.data.user.timezone || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Kayit</div>
                                                <div className="mt-2 text-sm text-white/80">{formatDate(userDetailQuery.data.user.created_at as unknown as string)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Son Guncelleme</div>
                                                <div className="mt-2 text-sm text-white/80">{formatDate(userDetailQuery.data.user.updated_at as unknown as string)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Son Sistem Hareketi</div>
                                                <div className="mt-2 text-sm text-white/80">
                                                    {userDetailQuery.data.stats.lastSeenAt
                                                        ? formatDate(userDetailQuery.data.stats.lastSeenAt as unknown as string)
                                                        : "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Durum</div>
                                                <div className="mt-2 text-sm text-white/80">
                                                    {userDetailQuery.data.stats.activeSessions > 0 ? "Muhtemelen online" : "Aktif oturum yok"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${userDetailQuery.data.user.email_verified ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>
                                                {userDetailQuery.data.user.email_verified ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                                E-posta {userDetailQuery.data.user.email_verified ? "dogrulandi" : "dogrulanmadi"}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${userDetailQuery.data.user.phone_verified ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/60"}`}>
                                                {userDetailQuery.data.user.phone_verified ? <CheckCircle size={13} /> : <Phone size={13} />}
                                                Telefon {userDetailQuery.data.user.phone_verified ? "dogrulandi" : "dogrulanmadi"}
                                            </span>
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${userDetailQuery.data.user.two_factor_enabled ? "border-sky-400/20 bg-sky-500/10 text-sky-200" : "border-white/10 bg-white/5 text-white/60"}`}>
                                                <Shield size={13} />
                                                2FA {userDetailQuery.data.user.two_factor_enabled ? "acik" : "kapali"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <Building2 size={18} className="text-fuchsia-200" />
                                            Organizasyon
                                        </div>
                                        <div className="mt-5 space-y-4">
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.14em] text-white/35">Organizasyon Adi</div>
                                                <div className="mt-2 text-base font-semibold text-white">
                                                    {userDetailQuery.data.user.organizations?.name || "-"}
                                                </div>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Slug</div>
                                                    <div className="mt-2 text-sm text-white/75">{userDetailQuery.data.user.organizations?.slug || "-"}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Plan</div>
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-white/75">
                                                        <span>{userDetailQuery.data.user.organizations?.plan || "-"}</span>
                                                        {String(userDetailQuery.data.user.organizations?.plan || "").toLowerCase() === "spring_pilot_500" ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                                                                <Sparkles size={12} />
                                                                Pilot aktif
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Org. Kullanicisi</div>
                                                    <div className="mt-2 text-sm text-white/75">{userDetailQuery.data.stats.organizationUsersCount}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Domain</div>
                                                    <div className="mt-2 text-sm text-white/75">{userDetailQuery.data.stats.organizationDomainsCount}</div>
                                                </div>
                                            </div>
                                            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <div className="text-sm font-semibold text-white">Spring Pilot 500</div>
                                                        <div className="mt-1 text-xs text-white/45">
                                                            1 Nisan - 31 Mayis arasi 500 canli katilimci; branding acik, domain ayarlari kapali.
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAssignSpringPilot(userDetailQuery.data!.user.id)}
                                                        disabled={assignSpringPilotMutation.isPending || String(userDetailQuery.data.user.organizations?.plan || "").toLowerCase() === "spring_pilot_500"}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Sparkles size={15} />
                                                        {assignSpringPilotMutation.isPending ? "Ataniyor..." : "Pilot 500 Ata"}
                                                    </button>
                                                </div>
                                                <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
                                                    <div className={`rounded-xl border px-3 py-2 ${userDetailQuery.data.user.email_verified ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>
                                                        E-posta: {userDetailQuery.data.user.email_verified ? "Dogrulandi" : "Eksik"}
                                                    </div>
                                                    <div className={`rounded-xl border px-3 py-2 ${userDetailQuery.data.user.phone_verified ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>
                                                        Telefon: {userDetailQuery.data.user.phone_verified ? "Dogrulandi" : "Eksik"}
                                                    </div>
                                                    <div className={`rounded-xl border px-3 py-2 ${userDetailQuery.data.user.company ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-rose-400/20 bg-rose-500/10 text-rose-200"}`}>
                                                        Sirket: {userDetailQuery.data.user.company ? "Hazir" : "Eksik"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <Clock3 size={18} className="text-fuchsia-200" />
                                        Son Aktivite Kayitlari
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        {userDetailQuery.data.recentAuditLogs.length > 0 ? (
                                            userDetailQuery.data.recentAuditLogs.map((log) => (
                                                <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold text-white">{formatAuditAction(log.action, log.resource)}</div>
                                                            <div className="mt-1 text-xs text-white/45">{formatDate(log.createdAt as unknown as string)}</div>
                                                        </div>
                                                        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                                                            {log.resource}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                                                        {log.ipAddress ? <span>IP: {log.ipAddress}</span> : null}
                                                        {log.resourceId ? <span>Kayit: {log.resourceId}</span> : null}
                                                    </div>
                                                    {log.details?.length ? (
                                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                            {log.details.map((detail) => (
                                                                <div key={`${log.id}-${detail.key}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                                                                    <span className="text-white/35">{detail.key}:</span> {detail.value}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-xs text-white/35">Bu kayit icin ek detay yok.</div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">
                                                Kullaniciya bagli audit kaydi bulunmuyor. Bu panel, sistemde gercekten kayda alinan islemleri gosterebilir.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <CalendarClock size={18} className="text-fuchsia-200" />
                                            Olusturulan Eventler
                                        </div>
                                        <div className="mt-5 space-y-3">
                                            {userDetailQuery.data.recentEvents.length > 0 ? (
                                                userDetailQuery.data.recentEvents.map((event) => (
                                                    <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-semibold text-white">{event.name}</div>
                                                                <div className="mt-1 text-xs text-white/45">
                                                                    {event.type} · {event.status} · {formatDate(event.createdAt as unknown as string)}
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={16} className="mt-1 text-white/20" />
                                                        </div>
                                                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/65">
                                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                                                Aktivite: {event.counts.activities}
                                                            </div>
                                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                                                Katilimci: {event.counts.participants}
                                                            </div>
                                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                                                Soru: {event.counts.qanda_submissions}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">
                                                    Bu kullaniciya yaratici olarak baglanmis event kaydi bulunmadi.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <Building2 size={18} className="text-fuchsia-200" />
                                            Son Abonelik Kayitlari
                                        </div>
                                        <div className="mt-5 space-y-3">
                                            {userDetailQuery.data.recentSubscriptions.length > 0 ? (
                                                userDetailQuery.data.recentSubscriptions.map((subscription) => (
                                                    <div key={subscription.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-semibold text-white">{subscription.packageName || subscription.plan}</div>
                                                                <div className="mt-1 text-xs text-white/45">
                                                                    {subscription.paymentMethod || "-"} · {subscription.status || "-"}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-semibold text-emerald-200">
                                                                {formatCurrency(subscription.amount, subscription.currency)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 text-xs text-white/45">
                                                            Kayit: {formatDate(subscription.createdAt as unknown as string)}
                                                            {subscription.currentPeriodEnd ? ` · Donem sonu: ${formatDate(subscription.currentPeriodEnd as unknown as string)}` : ""}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-white/45">
                                                    Bu organizasyon icin abonelik kaydi bulunmuyor.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : null}
                    </div>
                </aside>
            </>
        ) : null}
        </>
    );
}
