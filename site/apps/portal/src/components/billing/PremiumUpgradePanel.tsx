"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, ShieldCheck, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@ks-interaktif/ui";
import { apiClient } from "@/services/api";
import { isSuperAdminRole, hasFullAccessRole } from "@/utils/auth";
import { fetchPortalAuthSession } from "@/utils/authSession";

type OrganizationAccess = {
    plan: string;
    hasActiveSubscription: boolean;
    trialEndsAt: string;
    isTrialActive: boolean;
    isExpired: boolean;
    isFreeOrTrial: boolean;
};

type PaymentPackage = {
    id: string;
    name: string;
    amount: number;
    currency: string;
    periodDays: number;
};

type PaymentMethod = "card" | "bank_transfer";

type MethodAvailability = Record<PaymentMethod, { enabled: boolean; reason: string | null }>;

type BankTransferAccount = {
    id: string;
    accountHolder: string | null;
    iban: string | null;
    bankName: string | null;
    branchName: string | null;
    branchCode: string | null;
    swiftCode: string | null;
};

type BankTransferRequest = {
    requestId: string;
    status: "pending_payment" | "payment_notified" | "under_review" | "approved" | "rejected" | "expired";
    referenceCode: string;
    expiresAt: string | null;
    notifiedAt: string | null;
    senderName: string | null;
    senderIban: string | null;
    note: string | null;
    bankAccount: BankTransferAccount;
    bankAccounts?: BankTransferAccount[];
    package: {
        id: string | null;
        name: string | null;
        amount: number | null;
        currency: string;
    };
};

export function PremiumUpgradePanel({
    title = "Premium'a Geç",
    description = "PayTR ile güvenli ödeme ile Premium planı aktive edin.",
    showHeader = true,
    showRefresh = true,
    autoStartPayment = false,
    onClose,
}: {
    title?: string;
    description?: string;
    showHeader?: boolean;
    showRefresh?: boolean;
    autoStartPayment?: boolean;
    onClose?: () => void;
}) {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [access, setAccess] = useState<OrganizationAccess | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingPayment, setStartingPayment] = useState(false);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
    const [methodAvailability, setMethodAvailability] = useState<MethodAvailability>({
        card: { enabled: true, reason: null },
        bank_transfer: { enabled: false, reason: "Havale / EFT hesap bilgileri henuz tanimli degil." },
    });
    const [packages, setPackages] = useState<PaymentPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>("event-starter");
    const [error, setError] = useState<string | null>(null);
    const [bankTransferRequest, setBankTransferRequest] = useState<BankTransferRequest | null>(null);
    const [bankTransferSenderName, setBankTransferSenderName] = useState("");
    const [bankTransferSenderIban, setBankTransferSenderIban] = useState("");
    const [bankTransferNote, setBankTransferNote] = useState("");
    const [notifyingBankTransfer, setNotifyingBankTransfer] = useState(false);
    const [bankTransferMessage, setBankTransferMessage] = useState<string | null>(null);
    const [showOtherBankAccounts, setShowOtherBankAccounts] = useState(false);

    const premiumPriceLabel = useMemo(() => {
        const selected = packages.find((item) => item.id === selectedPackageId);
        if (!selected) return process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "120 USD";
        const amount = (selected.amount / 100).toLocaleString("tr-TR");
        return `${amount} ${selected.currency}`;
    }, [packages, selectedPackageId]);

    const visibleBankAccounts = useMemo(() => {
        if (!bankTransferRequest) return [] as BankTransferAccount[];
        const accounts = Array.isArray(bankTransferRequest.bankAccounts) && bankTransferRequest.bankAccounts.length > 0
            ? bankTransferRequest.bankAccounts
            : [bankTransferRequest.bankAccount];
        return accounts
            .filter((account) => Boolean(account?.bankName && account?.iban))
            .sort((left, right) => {
                const leftPriority = left?.id === "garanti" || String(left?.bankName || "").toLowerCase().includes("garanti") ? 0 : 1;
                const rightPriority = right?.id === "garanti" || String(right?.bankName || "").toLowerCase().includes("garanti") ? 0 : 1;
                return leftPriority - rightPriority;
            });
    }, [bankTransferRequest]);

    const primaryBankAccount = visibleBankAccounts[0] ?? null;
    const secondaryBankAccounts = visibleBankAccounts.slice(1);

    const formatDateTime = (value: string | null) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fetchAccess = async () => {
        try {
            setLoading(true);
            setError(null);
            const r = await apiClient.get("/api/payments/access");
            setAccess(r.data?.access ?? null);
        } catch (e: any) {
            if (e?.response?.status === 401) {
                router.push("/login");
                return;
            }
            setError(e?.response?.data?.error || "Erişim bilgisi alınamadı");
        } finally {
            setLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const r = await apiClient.get("/api/payments/paytr/packages");
            const fetched = Array.isArray(r.data?.packages) ? (r.data.packages as PaymentPackage[]) : [];
            setPackages(fetched);
            if (fetched.length > 0 && !fetched.some((item) => item.id === selectedPackageId)) {
                setSelectedPackageId(fetched[0].id);
            }
        } catch (e: any) {
            setError(e?.response?.data?.error || "Paket bilgileri alınamadı");
        }
    };

    const fetchMethods = async () => {
        try {
            const r = await apiClient.get("/api/payments/methods");
            const methods = r.data?.methods as any;
            const next: MethodAvailability = {
                card: {
                    enabled: Boolean(methods?.card?.enabled),
                    reason: methods?.card?.reason ?? null,
                },
                bank_transfer: {
                    enabled: Boolean(methods?.bank_transfer?.enabled),
                    reason: methods?.bank_transfer?.reason ?? null,
                },
            };
            setMethodAvailability(next);

            if (!next[paymentMethod].enabled) {
                setPaymentMethod(next.card.enabled ? "card" : "bank_transfer");
            }
        } catch {
            // Keep defaults if methods endpoint is unavailable.
        }
    };

    const startPayment = async () => {
        try {
            setStartingPayment(true);
            setError(null);
            setBankTransferMessage(null);
            if (!methodAvailability[paymentMethod].enabled) {
                throw new Error(methodAvailability[paymentMethod].reason || "Secilen odeme yontemi su anda aktif degil");
            }

            if (paymentMethod === "bank_transfer") {
                setIframeUrl(null);
                const r = await apiClient.post("/api/payments/bank-transfer/create", {
                    packageId: selectedPackageId,
                });
                const nextRequest = r.data as BankTransferRequest | undefined;
                if (!nextRequest?.requestId) {
                    throw new Error("Havale / EFT talebi olusturulamadi");
                }
                setBankTransferRequest(nextRequest);
                setBankTransferSenderName(nextRequest.senderName || "");
                setBankTransferSenderIban(nextRequest.senderIban || "");
                setBankTransferNote(nextRequest.note || "");
                return;
            }

            const r = await apiClient.post("/api/payments/paytr/iframe/token", {
                packageId: selectedPackageId,
            });
            const url = r.data?.iframeUrl as string | undefined;
            if (!url) {
                throw new Error("PayTR iframe URL alinamadi");
            }
            setIframeUrl(url);
        } catch (e: any) {
            if (e?.response?.status === 401) {
                router.push("/login");
                return;
            }
            setError(e?.response?.data?.error || e?.message || "Ödeme başlatılamadı");
        } finally {
            setStartingPayment(false);
        }
    };

    const notifyBankTransfer = async () => {
        if (!bankTransferRequest?.requestId) {
            setError("Once Havale / EFT talebi olusturun.");
            return;
        }

        try {
            setNotifyingBankTransfer(true);
            setError(null);
            setBankTransferMessage(null);

            const r = await apiClient.post("/api/payments/bank-transfer/notify", {
                requestId: bankTransferRequest.requestId,
                senderName: bankTransferSenderName,
                senderIban: bankTransferSenderIban,
                note: bankTransferNote,
            });
            const nextRequest = r.data as BankTransferRequest | undefined;
            if (!nextRequest?.requestId) {
                throw new Error("Odeme bildirimi kaydedilemedi");
            }
            setBankTransferRequest(nextRequest);
            setBankTransferMessage("Bildirim kaydedildi. Havaleniz kontrol edildikten sonra paketiniz aktive edilecek.");
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || "Odeme bildirimi kaydedilemedi");
        } finally {
            setNotifyingBankTransfer(false);
        }
    };

    const handleSelectPaymentMethod = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setError(null);
        setBankTransferMessage(null);
        if (method === "card") {
            return;
        }
        setIframeUrl(null);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const packageIdFromUrl = new URLSearchParams(window.location.search).get("package");
            if (packageIdFromUrl) {
                setSelectedPackageId(packageIdFromUrl);
            }
        }
        try {
            void fetchPortalAuthSession()
                .then((session) => setRole(session.role))
                .catch(() => setRole(null));
        } catch {
            setRole(null);
        }
        fetchAccess();
        fetchPackages();
        fetchMethods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (autoStartPayment) {
            startPayment();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStartPayment, paymentMethod]);

    useEffect(() => {
        setShowOtherBankAccounts(false);
    }, [bankTransferRequest?.requestId]);

    const isSuperAdmin = hasFullAccessRole(role);

    const isPremium = Boolean(
        isSuperAdmin ||
            (access &&
                (!access.isFreeOrTrial || access.hasActiveSubscription) &&
                String(access.plan || "").toLowerCase() !== "free")
    );

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">{title}</h1>
                        <p className="text-gray-500 mt-1">{description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                            <ShieldCheck className="text-green-600" size={18} />
                            Güvenli ödeme
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                            >
                                Kapat
                            </button>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 flex items-start gap-3">
                    <AlertCircle size={20} className="mt-0.5" />
                    <div>
                        <div className="font-semibold">Bir sorun oluştu</div>
                        <div className="text-sm mt-1">{error}</div>
                    </div>
                </div>
            ) : null}

            {isPremium && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800 flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5" />
                    <div>
                        <div className="font-semibold">Premium aktif</div>
                        <div className="text-sm mt-1">
                            {isSuperAdmin
                                ? "Süper Admin hesabı: Premium özellikler otomatik açık."
                                : "Hesabınız şu an Premium özelliklere erişiyor."}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow">
                            <Crown className="text-white" size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">Tek Paket</div>
                            <div className="text-sm text-gray-500">{premiumPriceLabel}</div>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                        <label className="block">
                            <span className="text-xs text-gray-500">Paket seçimi</span>
                            <select
                                value={selectedPackageId}
                                onChange={(e) => setSelectedPackageId(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                                disabled={startingPayment || isSuperAdmin}
                            >
                                {packages.map((item) => {
                                    const amount = (item.amount / 100).toLocaleString("tr-TR");
                                    return (
                                        <option key={item.id} value={item.id}>
                                            {item.name} - {amount} {item.currency}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-500" /> Odeme yontemi
                        </div>
                        <div className={`grid ${methodAvailability.bank_transfer.enabled ? "grid-cols-2" : "grid-cols-1"} gap-2 mt-2`}>
                            <button
                                type="button"
                                onClick={() => handleSelectPaymentMethod("card")}
                                className={`px-3 py-2 rounded-lg border text-sm ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"}`}
                                disabled={startingPayment || isSuperAdmin || !methodAvailability.card.enabled}
                            >
                                Kart
                            </button>
                            {methodAvailability.bank_transfer.enabled ? (
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaymentMethod("bank_transfer")}
                                    className={`px-3 py-2 rounded-lg border text-sm ${paymentMethod === "bank_transfer" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"}`}
                                    disabled={startingPayment || isSuperAdmin || !methodAvailability.bank_transfer.enabled}
                                >
                                    Havale / EFT
                                </button>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-gray-500" /> Güvenli işlem
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={startPayment}
                            disabled={startingPayment || isSuperAdmin || !methodAvailability[paymentMethod].enabled}
                            className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2 shadow-lg shadow-red-900/20 border-0 rounded-full px-6 py-5"
                        >
                            {isSuperAdmin
                                ? "Super Admin"
                                : startingPayment
                                    ? paymentMethod === "bank_transfer"
                                        ? "Talep olusturuluyor..."
                                        : "Aciliyor..."
                                    : paymentMethod === "bank_transfer"
                                        ? "Havale / EFT Bilgilerini Goster"
                                        : "Kart ile Ode"}
                        </Button>
                        {showRefresh && (
                            <button
                                type="button"
                                onClick={fetchAccess}
                                className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Durumu yenile
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
                    {paymentMethod === "bank_transfer" ? (
                        !bankTransferRequest ? (
                            <div className="text-gray-500 text-sm">
                                Havale / EFT seceneginde once banka bilgilerini ve referans kodunu olusturmaniz gerekir.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-lg font-bold text-gray-900">Havale / EFT Bilgileri</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Asagidaki hesaplardan istediginize odeme yapabilirsiniz. Aciklama kismina referans kodunu aynen yazin, odeme sonrasinda asagidan bildirim birakin.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        ["Referans Kodu", bankTransferRequest.referenceCode],
                                        ["Son Odeme Tarihi", formatDateTime(bankTransferRequest.expiresAt)],
                                        ["Paket", bankTransferRequest.package.name || "-"],
                                        ["Toplam", bankTransferRequest.package.amount ? `${(Number(bankTransferRequest.package.amount) / 100).toLocaleString("tr-TR")} ${bankTransferRequest.package.currency}` : "-"],
                                        ["Durum", bankTransferRequest.status],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                            <div className="text-xs text-gray-500 mb-1">{label}</div>
                                            <div className="text-sm font-semibold text-gray-900 break-all">{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {primaryBankAccount ? (
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div>
                                                <div className="text-lg font-bold text-gray-900">{primaryBankAccount.bankName || "-"}</div>
                                                <div className="text-sm text-gray-600 mt-1">Varsayilan havale / EFT hesabi</div>
                                            </div>
                                            <div className="text-xs font-medium text-blue-700 bg-white px-3 py-1.5 rounded-full border border-blue-200">
                                                Referans kodunu aciklamaya yazin
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                            <div className="rounded-xl border border-blue-100 bg-white p-4">
                                                <div className="text-xs text-gray-500">Hesap Sahibi</div>
                                                <div className="mt-1 font-semibold text-gray-900">{primaryBankAccount.accountHolder || "-"}</div>
                                            </div>
                                            <div className="rounded-xl border border-blue-100 bg-white p-4">
                                                <div className="text-xs text-gray-500">IBAN</div>
                                                <div className="mt-1 font-semibold text-gray-900 break-all">{primaryBankAccount.iban || "-"}</div>
                                            </div>
                                            {primaryBankAccount.branchName ? (
                                                <div className="rounded-xl border border-blue-100 bg-white p-4">
                                                    <div className="text-xs text-gray-500">Sube</div>
                                                    <div className="mt-1">{primaryBankAccount.branchName}</div>
                                                </div>
                                            ) : null}
                                            {primaryBankAccount.branchCode ? (
                                                <div className="rounded-xl border border-blue-100 bg-white p-4">
                                                    <div className="text-xs text-gray-500">Sube Kodu</div>
                                                    <div className="mt-1">{primaryBankAccount.branchCode}</div>
                                                </div>
                                            ) : null}
                                            {primaryBankAccount.swiftCode ? (
                                                <div className="rounded-xl border border-blue-100 bg-white p-4 md:col-span-2">
                                                    <div className="text-xs text-gray-500">SWIFT</div>
                                                    <div className="mt-1">{primaryBankAccount.swiftCode}</div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                {secondaryBankAccounts.length > 0 ? (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowOtherBankAccounts((current) => !current)}
                                            className="text-sm font-medium text-blue-700 hover:text-blue-800"
                                        >
                                            {showOtherBankAccounts
                                                ? "Diger banka hesaplarini gizle"
                                                : "Diger banka hesaplarini goster"}
                                        </button>

                                        {showOtherBankAccounts ? (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                {secondaryBankAccounts.map((account) => (
                                                    <div key={account.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="text-base font-bold text-gray-900">{account.bankName || "-"}</div>
                                                            <div className="text-xs font-medium text-blue-700 bg-white px-2 py-1 rounded-full border border-gray-200">
                                                                Alternatif hesap
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 space-y-2 text-sm text-gray-700">
                                                            <div>
                                                                <div className="text-xs text-gray-500">Hesap Sahibi</div>
                                                                <div className="font-semibold text-gray-900">{account.accountHolder || "-"}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">IBAN</div>
                                                                <div className="font-semibold text-gray-900 break-all">{account.iban || "-"}</div>
                                                            </div>
                                                            {account.branchName ? (
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Sube</div>
                                                                    <div>{account.branchName}</div>
                                                                </div>
                                                            ) : null}
                                                            {account.branchCode ? (
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Sube Kodu</div>
                                                                    <div>{account.branchCode}</div>
                                                                </div>
                                                            ) : null}
                                                            {account.swiftCode ? (
                                                                <div>
                                                                    <div className="text-xs text-gray-500">SWIFT</div>
                                                                    <div>{account.swiftCode}</div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="space-y-3">
                                    <input
                                        value={bankTransferSenderName}
                                        onChange={(event) => setBankTransferSenderName(event.target.value)}
                                        placeholder="Gonderen adi soyadi"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900"
                                    />
                                    <input
                                        value={bankTransferSenderIban}
                                        onChange={(event) => setBankTransferSenderIban(event.target.value)}
                                        placeholder="Gonderen IBAN (opsiyonel)"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900"
                                    />
                                    <textarea
                                        value={bankTransferNote}
                                        onChange={(event) => setBankTransferNote(event.target.value)}
                                        placeholder="Dekont notu veya aciklama"
                                        rows={4}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 resize-y"
                                    />
                                </div>

                                <Button
                                    onClick={notifyBankTransfer}
                                    disabled={notifyingBankTransfer}
                                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-full px-6 py-5"
                                >
                                    {notifyingBankTransfer ? "Bildirim Gonderiliyor..." : "Odeme Bildirimi Birak"}
                                </Button>

                                {bankTransferMessage ? (
                                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                                        {bankTransferMessage}
                                    </div>
                                ) : null}
                            </div>
                        )
                    ) : !iframeUrl ? (
                        <div className="text-gray-500 text-sm">
                            {isSuperAdmin
                                ? "Super Admin hesabinda odeme gerekmez."
                                : "Soldan kartli odemeyi baslatarak PayTR ekranini acabilirsiniz."}
                        </div>
                    ) : (
                        <div className="w-full">
                            <iframe
                                title="PayTR Odeme"
                                src={iframeUrl}
                                className="w-full rounded-xl border border-gray-200"
                                style={{ height: 720 }}
                            />
                            <div className="text-xs text-gray-500 mt-3">
                                Odeme tamamlandiktan sonra Premium erisiminiz otomatik aktive olur.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
