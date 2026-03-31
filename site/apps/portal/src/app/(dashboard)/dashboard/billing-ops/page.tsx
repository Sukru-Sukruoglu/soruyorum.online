"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Database,
    Layers3,
    Loader2,
    Search,
    Shield,
    Wallet,
    XCircle,
} from "lucide-react";
import { trpc } from "../../../../utils/trpc";
import { isSuperAdminRole } from "../../../../utils/auth";
import { fetchPortalAuthSession } from "../../../../utils/authSession";

type BillingOpsFilters = {
    search?: string;
    plan?: string;
    subscriptionStatus?: string;
    gatewayStatus?: string;
    activationStatus?: string;
    expiredOnly?: boolean;
    addonOnly?: boolean;
};

type BillingOpsRecord = NonNullable<ReturnType<typeof trpc.dashboard.getBillingOps.useQuery>["data"]>["records"][number];

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "-";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
    if (typeof amount !== "number") return "-";
    const normalizedCurrency = currency || "TRY";
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: normalizedCurrency,
        maximumFractionDigits: 2,
    }).format(amount / 100);
}

function statusTone(status: string | null | undefined): string {
    const normalized = (status ?? "none").toLowerCase();
    if (["active", "success"].includes(normalized)) return "bg-emerald-500/15 text-emerald-200 border-emerald-400/20";
    if (["pending", "processing", "trial"].includes(normalized)) return "bg-amber-500/15 text-amber-200 border-amber-400/20";
    if (["failed", "expired", "missing"].includes(normalized)) return "bg-rose-500/15 text-rose-200 border-rose-400/20";
    return "bg-slate-500/15 text-slate-200 border-slate-400/20";
}

function prettyStatus(status: string | null | undefined): string {
    const normalized = (status ?? "none").toLowerCase();
    const map: Record<string, string> = {
        active: "Aktif",
        pending: "Pending",
        failed: "Başarısız",
        expired: "Süresi Doldu",
        success: "Success",
        missing: "Eksik",
        none: "Yok",
        free: "EVENT PASS",
        trial: "Trial",
    };
    return map[normalized] || normalized;
}

function Badge({ value }: { value: string | null | undefined }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(value)}`}>
            {prettyStatus(value)}
        </span>
    );
}

function KpiCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    tone: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">{label}</div>
                    <div className="mt-3 text-3xl font-black text-white">{value}</div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

function buildTimeline(record: BillingOpsRecord) {
    const items: Array<{ label: string; at: string | null; tone: string }> = [];
    items.push({ label: "Pending created", at: record.subscription?.createdAt ?? record.createdAt, tone: "slate" });
    if (record.subscription?.gatewayStatus === "success") {
        items.push({ label: "Callback success", at: record.subscription?.updatedAt ?? null, tone: "emerald" });
    }
    if (record.subscription?.gatewayStatus === "failed") {
        items.push({ label: "Callback failed", at: record.subscription?.updatedAt ?? null, tone: "rose" });
    }
    if (record.metadata.activation && typeof record.metadata.activation.activated_at === "string") {
        items.push({ label: "Activated", at: String(record.metadata.activation.activated_at), tone: "emerald" });
    }
    if (record.subscription?.status === "expired") {
        items.push({ label: "Expired / downgraded", at: record.subscription.currentPeriodEnd ?? record.updatedAt, tone: "amber" });
    }
    return items;
}

export default function BillingOpsPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [filters, setFilters] = useState<BillingOpsFilters>({
        search: "",
        plan: "all",
        subscriptionStatus: "all",
        gatewayStatus: "all",
        activationStatus: "all",
        expiredOnly: false,
        addonOnly: false,
    });

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

    const queryInput = useMemo(
        () => ({
            search: filters.search?.trim() || undefined,
            plan: filters.plan && filters.plan !== "all" ? filters.plan : undefined,
            subscriptionStatus: filters.subscriptionStatus && filters.subscriptionStatus !== "all" ? filters.subscriptionStatus : undefined,
            gatewayStatus: filters.gatewayStatus && filters.gatewayStatus !== "all" ? filters.gatewayStatus : undefined,
            activationStatus: filters.activationStatus && filters.activationStatus !== "all" ? filters.activationStatus : undefined,
            expiredOnly: filters.expiredOnly || undefined,
            addonOnly: filters.addonOnly || undefined,
        }),
        [filters]
    );

    const { data, isLoading, error, refetch, isFetching } = trpc.dashboard.getBillingOps.useQuery(queryInput, {
        enabled: isSuperAdminRole(role),
        retry: false,
        refetchOnWindowFocus: true,
    });

    const selectedRecord = useMemo(
        () => data?.records.find((record) => record.organizationId === selectedRecordId) ?? data?.records[0] ?? null,
        [data?.records, selectedRecordId]
    );

    useEffect(() => {
        if (!selectedRecordId && data?.records[0]) {
            setSelectedRecordId(data.records[0].organizationId);
        }
    }, [data?.records, selectedRecordId]);

    const planOptions = useMemo(() => {
        const values = new Set<string>();
        for (const record of data?.records ?? []) {
            values.add(record.rawOrganizationPlan);
            values.add(record.effectiveAccess.plan);
        }
        return Array.from(values).sort();
    }, [data?.records]);

    if (isLoading && !data) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-white/60">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <Loader2 className="animate-spin" size={20} />
                    Billing Ops yükleniyor...
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1520px] px-4 py-8 text-white lg:px-6 xl:px-8 2xl:px-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                        <Shield size={14} />
                        Super Admin Only
                    </div>
                    <h1 className="mt-4 flex items-center gap-3 text-3xl font-black tracking-tight text-white">
                        <Wallet className="text-amber-300" size={30} />
                        Billing Ops
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/55">
                        Payment, subscription, addon, callback ve effective access durumlarini operasyonel olarak tek ekrandan izleyin.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                    {isFetching ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                    Yenile
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <KpiCard icon={CheckCircle2} label="Active Subscriptions" value={data?.summary.activeSubscriptionsCount ?? 0} tone="bg-emerald-500/15 text-emerald-200" />
                <KpiCard icon={CalendarClock} label="Pending Payments" value={data?.summary.pendingPaymentsCount ?? 0} tone="bg-amber-500/15 text-amber-200" />
                <KpiCard icon={XCircle} label="Failed Payments" value={data?.summary.failedPaymentsCount ?? 0} tone="bg-rose-500/15 text-rose-200" />
                <KpiCard icon={AlertTriangle} label="Expired Subs" value={data?.summary.expiredSubscriptionsCount ?? 0} tone="bg-orange-500/15 text-orange-200" />
                <KpiCard icon={Layers3} label="Active Addons" value={data?.summary.activeAddonSubscriptionsCount ?? 0} tone="bg-sky-500/15 text-sky-200" />
                <KpiCard icon={AlertTriangle} label="Trial Orgs" value={data?.summary.trialOrganizationsCount ?? 0} tone="bg-violet-500/15 text-violet-200" />
            </div>

            <div className="mt-8 rounded-3xl border border-rose-400/15 bg-rose-500/5 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.14)]">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-rose-200">
                    <AlertTriangle size={16} />
                    Problem Records
                </div>
                {data?.problemRecords.length ? (
                    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                        {data.problemRecords.map((problem) => (
                            <button
                                key={`${problem.organizationId}-${problem.updatedAt}`}
                                type="button"
                                onClick={() => setSelectedRecordId(problem.organizationId)}
                                className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-rose-300/30 hover:bg-black/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="break-words font-bold text-white">{problem.organizationName}</div>
                                        <div className="mt-1 break-all text-xs text-white/45">{problem.merchantOid || "merchant_oid yok"}</div>
                                    </div>
                                    <ChevronRight size={18} className="text-white/35" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge value={problem.subscriptionStatus} />
                                    <Badge value={problem.gatewayStatus} />
                                    <Badge value={problem.activationStatus} />
                                </div>
                                <ul className="mt-3 space-y-1 text-sm text-rose-100/90">
                                    {problem.problemReasons.map((reason) => (
                                        <li key={reason}>• {reason}</li>
                                    ))}
                                </ul>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-5 text-sm text-emerald-100/85">
                        Problem kaydi bulunmuyor.
                    </div>
                )}
            </div>

            <div className="mt-8 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
                    <div className="border-b border-white/10 p-5">
                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                            <label className="relative block 2xl:col-span-2">
                                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                                <input
                                    value={filters.search}
                                    onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))}
                                    placeholder="Organizasyon, owner email veya merchant_oid ara"
                                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-300/40"
                                />
                            </label>

                            <select
                                value={filters.plan}
                                onChange={(e) => setFilters((current) => ({ ...current, plan: e.target.value }))}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="all">Plan: All</option>
                                {planOptions.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>

                            <select
                                value={filters.subscriptionStatus}
                                onChange={(e) => setFilters((current) => ({ ...current, subscriptionStatus: e.target.value }))}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="all">Subscription: All</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                                <option value="none">None</option>
                            </select>

                            <select
                                value={filters.gatewayStatus}
                                onChange={(e) => setFilters((current) => ({ ...current, gatewayStatus: e.target.value }))}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="all">Gateway: All</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="none">None</option>
                            </select>

                            <select
                                value={filters.activationStatus}
                                onChange={(e) => setFilters((current) => ({ ...current, activationStatus: e.target.value }))}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                            >
                                <option value="all">Activation: All</option>
                                <option value="active">Active</option>
                                <option value="failed">Failed</option>
                                <option value="missing">Missing</option>
                                <option value="none">None</option>
                            </select>

                            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                                <input type="checkbox" checked={Boolean(filters.expiredOnly)} onChange={(e) => setFilters((current) => ({ ...current, expiredOnly: e.target.checked }))} />
                                Expired only
                            </label>

                            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                                <input type="checkbox" checked={Boolean(filters.addonOnly)} onChange={(e) => setFilters((current) => ({ ...current, addonOnly: e.target.checked }))} />
                                Addon only
                            </label>
                        </div>
                    </div>

                    {error ? <div className="p-5 text-sm text-rose-300">Billing Ops yüklenemedi: {error.message}</div> : null}

                    <div className="p-4 sm:p-5">
                        <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/40 xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)] xl:gap-4">
                            <div>Organization</div>
                            <div>Effective Access</div>
                            <div>Subscription</div>
                            <div>Gateway</div>
                            <div>Activation</div>
                            <div>Updated</div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {(data?.records ?? []).map((record) => {
                                const isSelected = record.organizationId === selectedRecord?.organizationId;
                                return (
                                    <button
                                        key={record.organizationId}
                                        type="button"
                                        onClick={() => setSelectedRecordId(record.organizationId)}
                                        className={`block w-full rounded-2xl border px-4 py-4 text-left transition sm:px-5 ${isSelected ? "border-amber-300/30 bg-amber-500/10" : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"}`}
                                    >
                                        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)] xl:items-center">
                                            <div className="min-w-0">
                                                <div className="break-words text-xl font-bold text-white">{record.organizationName}</div>
                                                <div className="mt-2 grid gap-1 text-sm text-white/55 sm:grid-cols-2 xl:grid-cols-1">
                                                    <div className="break-all">{record.owner?.email || "owner yok"}</div>
                                                    <div className="break-all">{record.organizationSlug || record.organizationId}</div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Badge value={record.rawOrganizationPlan} />
                                                    {record.addons.length ? <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100">{record.addons.length} addon</span> : null}
                                                </div>
                                            </div>

                                            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3 xl:border-0 xl:bg-transparent xl:p-0">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 xl:hidden">Effective Access</div>
                                                <div className="mt-2 xl:mt-0"><Badge value={record.effectiveAccess.plan} /></div>
                                                <div className="mt-2 break-words text-sm text-white/45">{record.effectiveAccess.reason}</div>
                                                <div className="mt-1 text-xs text-white/35">Dönem sonu: {formatDateTime(record.subscription?.currentPeriodEnd)}</div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 xl:border-0 xl:bg-transparent xl:p-0">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 xl:hidden">Subscription</div>
                                                <div className="mt-2 xl:mt-0"><Badge value={record.subscription?.status} /></div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 xl:border-0 xl:bg-transparent xl:p-0">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 xl:hidden">Gateway</div>
                                                <div className="mt-2 xl:mt-0"><Badge value={record.subscription?.gatewayStatus} /></div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 xl:border-0 xl:bg-transparent xl:p-0">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 xl:hidden">Activation</div>
                                                <div className="mt-2 xl:mt-0"><Badge value={record.subscription?.activationStatus} /></div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 xl:border-0 xl:bg-transparent xl:p-0">
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35 xl:hidden">Updated</div>
                                                <div className="mt-2 text-sm text-white/70 xl:mt-0">{formatDateTime(record.updatedAt)}</div>
                                                {record.merchantOid ? <div className="mt-1 break-all text-xs text-white/35">{record.merchantOid}</div> : null}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {!isLoading && (data?.records.length ?? 0) === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/45">
                                    Kayıt bulunamadı.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
                    {selectedRecord ? (
                        <div className="min-w-0">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Detail</div>
                                    <h2 className="mt-2 break-words text-2xl font-black text-white">{selectedRecord.organizationName}</h2>
                                    <div className="mt-1 break-all text-sm text-white/45">{selectedRecord.owner?.email || "owner yok"}</div>
                                </div>
                                <Badge value={selectedRecord.subscription?.status} />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Organization</div>
                                    <div className="mt-3 space-y-2 text-sm text-white/80">
                                        <div>Plan: <span className="font-semibold text-white">{selectedRecord.rawOrganizationPlan}</span></div>
                                        <div>Effective: <span className="font-semibold text-white">{selectedRecord.effectiveAccess.plan}</span></div>
                                        <div>Reason: <span className="break-words text-white/65">{selectedRecord.effectiveAccess.reason}</span></div>
                                        <div>Trial Ends: <span className="text-white/65">{formatDateTime(selectedRecord.effectiveAccess.trialEndsAt)}</span></div>
                                    </div>
                                </div>

                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">Owner</div>
                                    <div className="mt-3 space-y-2 text-sm text-white/80">
                                        <div>Name: <span className="font-semibold text-white">{selectedRecord.owner?.name || "-"}</span></div>
                                        <div>Email: <span className="break-all text-white/65">{selectedRecord.owner?.email || "-"}</span></div>
                                        <div>Role: <span className="text-white/65">{selectedRecord.owner?.role || "-"}</span></div>
                                        <div>Phone: <span className="text-white/65">{selectedRecord.owner?.phone || "-"}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Subscription</div>
                                <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-2">
                                    <div>Package: <span className="font-semibold text-white">{selectedRecord.subscription?.packageName || selectedRecord.subscription?.packageId || "-"}</span></div>
                                    <div>Amount: <span className="font-semibold text-white">{formatAmount(selectedRecord.subscription?.amount, selectedRecord.subscription?.currency)}</span></div>
                                    <div>Payment Method: <span className="text-white/65">{selectedRecord.subscription?.paymentMethod || "-"}</span></div>
                                    <div>Merchant OID: <span className="text-white/65 break-all">{selectedRecord.merchantOid || "-"}</span></div>
                                    <div>Start: <span className="text-white/65">{formatDateTime(selectedRecord.subscription?.currentPeriodStart)}</span></div>
                                    <div>End: <span className="text-white/65">{formatDateTime(selectedRecord.subscription?.currentPeriodEnd)}</span></div>
                                    <div>Created: <span className="text-white/65">{formatDateTime(selectedRecord.subscription?.createdAt)}</span></div>
                                    <div>Updated: <span className="text-white/65">{formatDateTime(selectedRecord.subscription?.updatedAt)}</span></div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge value={selectedRecord.subscription?.status} />
                                    <Badge value={selectedRecord.subscription?.gatewayStatus} />
                                    <Badge value={selectedRecord.subscription?.activationStatus} />
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Timeline</div>
                                <div className="space-y-3">
                                    {buildTimeline(selectedRecord).map((item) => (
                                        <div key={`${item.label}-${item.at}`} className="flex items-start gap-3">
                                            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone === "emerald" ? "bg-emerald-300" : item.tone === "rose" ? "bg-rose-300" : item.tone === "amber" ? "bg-amber-300" : "bg-slate-300"}`} />
                                            <div>
                                                <div className="text-sm font-semibold text-white">{item.label}</div>
                                                <div className="text-xs text-white/45">{formatDateTime(item.at)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4">
                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Addons</div>
                                    {selectedRecord.addons.length ? (
                                        <div className="space-y-2 text-sm text-white/80">
                                            {selectedRecord.addons.map((addon, index) => (
                                                <div key={`${addon.id}-${index}`} className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
                                                    <div className="break-words font-semibold text-white">{addon.name || addon.id || "Addon"}</div>
                                                    <div className="mt-1 break-all text-xs text-white/45">{addon.scope || "scope yok"}{addon.eventId ? ` • event ${addon.eventId}` : ""}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="text-sm text-white/45">Aktif addon yok.</div>}
                                </div>

                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Entitlements</div>
                                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75">{JSON.stringify(selectedRecord.entitlements, null, 2)}</pre>
                                </div>

                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Gateway Metadata</div>
                                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75">{JSON.stringify(selectedRecord.metadata.gateway, null, 2)}</pre>
                                </div>

                                <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
                                    <div className="mb-3 text-xs uppercase tracking-[0.14em] text-white/35">Activation Metadata</div>
                                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75">{JSON.stringify(selectedRecord.metadata.activation, null, 2)}</pre>
                                </div>

                                <div className="rounded-2xl border border-rose-400/15 bg-rose-500/5 p-4">
                                    <div className="mb-3 text-xs uppercase tracking-[0.14em] text-rose-200">Problem Signals</div>
                                    {selectedRecord.problemReasons.length ? (
                                        <ul className="space-y-2 text-sm text-rose-100/90">
                                            {selectedRecord.problemReasons.map((reason) => (
                                                <li key={reason}>• {reason}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-sm text-emerald-100/80">Problem kaydi yok.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[320px] items-center justify-center text-sm text-white/45">
                            Secilecek billing kaydi yok.
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}