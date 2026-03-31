"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/services/api";
import { BillingAuthModal } from "@/components/billing/BillingAuthModal";
import {
    clearCart,
    createEmptyCart,
    getCartTotal,
    getCheckoutAddonIds,
    getPrimaryPackage,
    readStoredCart,
    removeCartLine,
    replaceCart,
    setAddonEnabled,
    setPackageLine,
    subscribeToCart,
} from "@/lib/cart";
import { fetchPortalAuthSession } from "@/utils/authSession";

/* ── Types ── */
type PricingCard = {
    title: string;
    price: string;
    support?: string;
    features?: string[];
    packageId?: string;
    cta?: string;
};

type PricingSection = {
    id: string;
    label: string;
    description?: string;
    cards: PricingCard[];
};

type CartItem = {
    key: string;
    name: string;
    description?: string;
    features?: string[];
    price: number; // TL cinsinden
    removable?: boolean;
    type: "package" | "addon";
    addonId?: "addon_remote" | "addon_onsite";
};

type PaymentMethod = "card" | "eft" | "bank_transfer";

type MethodAvailability = Record<PaymentMethod, { enabled: boolean; reason: string | null }>;

type BankTransferAccount = {
    id?: string;
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

/* ── Helpers ── */
function parsePriceTL(raw: string): number {
    const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

const ADDON_REMOTE_PRICE = 7_000;
const ADDON_ONSITE_PRICE = 20_000;
const PRICING_PAGE_HREF = "/plans-preview";

export default function BillingPage() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const legacyPackageId = searchParams.get("package") || "";
    const addonRemote = searchParams.get("addon_remote") === "1";
    const addonOnsite = searchParams.get("addon_onsite") === "1";

    const [cart, setCart] = useState(createEmptyCart());
    const [cartInitialized, setCartInitialized] = useState(false);
    const [legacyHydrating, setLegacyHydrating] = useState(false);
    const [startingPayment, setStartingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
    const [methodAvailability, setMethodAvailability] = useState<MethodAvailability>({
        card: { enabled: true, reason: null },
        eft: { enabled: true, reason: null },
        bank_transfer: { enabled: false, reason: "Havale/EFT banka hesap bilgileri tanimli degil." },
    });
    const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);
    const [bankTransferRequest, setBankTransferRequest] = useState<BankTransferRequest | null>(null);
    const [bankTransferSenderName, setBankTransferSenderName] = useState("");
    const [bankTransferSenderIban, setBankTransferSenderIban] = useState("");
    const [bankTransferNote, setBankTransferNote] = useState("");
    const [notifyingBankTransfer, setNotifyingBankTransfer] = useState(false);
    const [bankTransferMessage, setBankTransferMessage] = useState<string | null>(null);
    const [showOtherBankAccounts, setShowOtherBankAccounts] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [resumeCheckoutAfterAuth, setResumeCheckoutAfterAuth] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const bankTransferModalOpen = activePaymentMethod === "bank_transfer" && Boolean(bankTransferRequest);
        if (!iframeUrl && !bankTransferModalOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePaymentOverlay();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activePaymentMethod, bankTransferRequest, iframeUrl]);

    useEffect(() => {
        if (pathname !== "/dashboard/billing" && (iframeUrl || activePaymentMethod === "bank_transfer")) {
            closePaymentOverlay();
        }
    }, [activePaymentMethod, iframeUrl, pathname]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncAuthState = () => {
            void fetchPortalAuthSession()
                .then((session) => {
                    setIsAuthenticated(session.authenticated);
                })
                .catch(() => {
                    setIsAuthenticated(false);
                });
        };

        syncAuthState();
        window.addEventListener("storage", syncAuthState);

        return () => {
            window.removeEventListener("storage", syncAuthState);
        };
    }, []);

    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const response = await apiClient.get("/api/payments/methods");
                const next = response.data?.methods as MethodAvailability | undefined;
                if (!next) return;
                setMethodAvailability(next);

                if (!next[paymentMethod]?.enabled) {
                    const firstEnabled = (Object.keys(next) as PaymentMethod[]).find((key) => next[key]?.enabled);
                    if (firstEnabled) setPaymentMethod(firstEnabled);
                }
            } catch {
                // Keep local defaults when availability endpoint is unreachable.
            }
        };

        void fetchMethods();
    }, [paymentMethod]);

    useEffect(() => {
        const syncCart = () => {
            setCart(readStoredCart());
            setCartInitialized(true);
        };

        syncCart();

        return subscribeToCart((nextCart) => {
            setCart(nextCart);
            setCartInitialized(true);
        });
    }, []);

    useEffect(() => {
        if (!cartInitialized) return;
        if (!legacyPackageId) return;
        if (getPrimaryPackage(cart)) return;

        let cancelled = false;

        const hydrateLegacyCart = async () => {
            setLegacyHydrating(true);

            try {
                const res = await fetch("/api/trpc/settings.getPricing?input=%7B%7D&batch=1");
                const json = await res.json();
                const data = json?.[0]?.result?.data;
                const sections = (data && typeof data === "object" && Array.isArray(data.sections)
                    ? data.sections
                    : []) as PricingSection[];

                let found: PricingCard | null = null;
                for (const section of sections) {
                    for (const card of section.cards) {
                        if (card.packageId === legacyPackageId) {
                            found = card;
                            break;
                        }
                    }
                    if (found) break;
                }

                if (!found || cancelled) {
                    return;
                }

                let nextCart = setPackageLine(createEmptyCart(), {
                    productId: found.packageId || legacyPackageId,
                    title: found.title,
                    description: found.support,
                    features: found.features,
                    price: parsePriceTL(found.price),
                });

                nextCart = setAddonEnabled(nextCart, {
                    addonId: "addon_remote",
                    title: "Remote Event Operator",
                    description: "Uzaktan etkinlik yonetimi ve canli teknik destek. Sadece 1 toplanti veya 1 event icin gecerlidir.",
                    price: ADDON_REMOTE_PRICE,
                }, addonRemote);

                nextCart = setAddonEnabled(nextCart, {
                    addonId: "addon_onsite",
                    title: "On-site Event Operator",
                    description: "Yerinde profesyonel operator ve tam kurulum destegi. Sadece 1 toplanti veya 1 event icin gecerlidir.",
                    price: ADDON_ONSITE_PRICE,
                }, addonOnsite);

                replaceCart(nextCart);

                if (typeof window !== "undefined") {
                    window.history.replaceState({}, "", "/dashboard/billing");
                }
            } catch {
                // Legacy URL migration is best-effort only.
            } finally {
                if (!cancelled) {
                    setLegacyHydrating(false);
                }
            }
        };

        void hydrateLegacyCart();

        return () => {
            cancelled = true;
        };
    }, [addonOnsite, addonRemote, cart, cartInitialized, legacyPackageId]);

    const loading = !cartInitialized || legacyHydrating;
    const items = useMemo<CartItem[]>(() => {
        return cart.lines.map((line) => ({
            key: line.key,
            name: line.title,
            description: line.description,
            features: line.features,
            price: line.price,
            removable: line.removable,
            type: line.kind,
            addonId: line.checkout?.addonId === "addon_remote" || line.checkout?.addonId === "addon_onsite"
                ? line.checkout.addonId
                : undefined,
        }));
    }, [cart]);
    const total = useMemo(() => getCartTotal(cart), [cart]);
    const selectedAddonIds = useMemo(() => getCheckoutAddonIds(cart), [cart]);
    const packageId = getPrimaryPackage(cart)?.checkout?.packageId || getPrimaryPackage(cart)?.productId || "";

    const removeItem = (key: string) => {
        replaceCart(removeCartLine(cart, key));
    };

    const formatPrice = (n: number) =>
        n.toLocaleString("tr-TR", { minimumFractionDigits: 0 }) + " TL";

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

    const bankTransferAccounts = useMemo<BankTransferAccount[]>(() => {
        if (!bankTransferRequest) return [];
        const accounts =
            Array.isArray(bankTransferRequest.bankAccounts) && bankTransferRequest.bankAccounts.length > 0
                ? bankTransferRequest.bankAccounts
                : [bankTransferRequest.bankAccount];
        return accounts.filter((account) => Boolean(account?.bankName && account?.iban));
    }, [bankTransferRequest]);

    const primaryBankAccount = bankTransferAccounts[0] ?? null;
    const otherBankAccounts = bankTransferAccounts.slice(1);

    const closePaymentOverlay = () => {
        setIframeUrl(null);
        setActivePaymentMethod(null);
    };

    useEffect(() => {
        setShowOtherBankAccounts(false);
    }, [bankTransferRequest?.requestId]);

    const buildReturnPath = () => {
        const query = searchParams.toString();
        return query ? `/dashboard/billing?${query}` : "/dashboard/billing";
    };

    const hasAuthSession = () => {
        return isAuthenticated;
    };

    const performCheckout = async () => {
        if (!packageId) {
            setPaymentError("Lutfen once bir paket secin.");
            return;
        }

        try {
            setStartingPayment(true);
            setPaymentError(null);
            setBankTransferMessage(null);

            if (paymentMethod === "bank_transfer") {
                const response = await apiClient.post("/api/payments/bank-transfer/create", {
                    packageId,
                    addons: selectedAddonIds,
                });

                const nextRequest = response.data as BankTransferRequest | undefined;
                if (!nextRequest?.requestId) {
                    throw new Error("Havale / EFT talebi olusturulamadi");
                }

                setBankTransferRequest(nextRequest);
                setBankTransferSenderName(nextRequest.senderName || "");
                setBankTransferSenderIban(nextRequest.senderIban || "");
                setBankTransferNote(nextRequest.note || "");
                setActivePaymentMethod("bank_transfer");
                return;
            }

            const paytrEndpoint =
                paymentMethod === "eft"
                    ? "/api/payments/paytr/eft/token"
                    : "/api/payments/paytr/iframe/token";

            const response = await apiClient.post(paytrEndpoint, {
                packageId,
                addons: selectedAddonIds,
            });

            const nextIframeUrl = response.data?.iframeUrl as string | undefined;
            if (!nextIframeUrl) {
                throw new Error(paymentMethod === "eft" ? "PayTR EFT iframe URL alinamadi" : "PayTR iframe URL alinamadi");
            }

            setActivePaymentMethod(paymentMethod);
            setIframeUrl(nextIframeUrl);
        } catch (error: any) {
            const reason = error?.response?.data?.reason;
            const message = error?.response?.data?.error || error?.message || "Odeme baslatilamadi";
            setPaymentError(reason ? `${message}: ${reason}` : message);
        } finally {
            setStartingPayment(false);
        }
    };

    const startPayment = async () => {
        if (!hasAuthSession()) {
            setPaymentError(null);
            setResumeCheckoutAfterAuth(true);
            setAuthModalOpen(true);
            return;
        }

        await performCheckout();
    };

    const handleAuthenticated = async () => {
        setIsAuthenticated(true);
        setAuthModalOpen(false);

        if (!resumeCheckoutAfterAuth) {
            return;
        }

        setResumeCheckoutAfterAuth(false);
        await performCheckout();
    };

    const notifyBankTransfer = async () => {
        if (!bankTransferRequest?.requestId) {
            setPaymentError("Once Havale / EFT talebi olusturun.");
            return;
        }

        try {
            setNotifyingBankTransfer(true);
            setPaymentError(null);
            setBankTransferMessage(null);

            const response = await apiClient.post("/api/payments/bank-transfer/notify", {
                requestId: bankTransferRequest.requestId,
                senderName: bankTransferSenderName,
                senderIban: bankTransferSenderIban,
                note: bankTransferNote,
            });

            const nextRequest = response.data as BankTransferRequest | undefined;
            if (!nextRequest?.requestId) {
                throw new Error("Odeme bildirimi kaydedilemedi");
            }

            setBankTransferRequest(nextRequest);
            setBankTransferMessage("Bildirim kaydedildi. Odemeniz kontrol edilip onaylandiginda paketiniz aktive edilecek.");
        } catch (error: any) {
            setPaymentError(error?.response?.data?.error || error?.message || "Odeme bildirimi kaydedilemedi");
        } finally {
            setNotifyingBankTransfer(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
        );
    }

    if (items.length === 0 && !loading) {
        return (
            <div className="p-8">
                <div
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        padding: "48px 32px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                    <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                        Sepetiniz Boş
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
                        Henüz bir paket seçmediniz. Fiyatlandırma sayfasından bir paket seçebilirsiniz.
                    </p>
                    <Link
                        href={PRICING_PAGE_HREF}
                        style={{
                            display: "inline-block",
                            padding: "12px 28px",
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 15,
                            textDecoration: "none",
                        }}
                    >
                        Paketleri İncele
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx>{`
                .billing-cart-table {
                    table-layout: fixed;
                    width: 100%;
                }

                .billing-cart-table col.billing-cart-col-service {
                    width: auto;
                }

                .billing-cart-table col.billing-cart-col-price {
                    width: 120px;
                }

                .billing-cart-table col.billing-cart-col-qty {
                    width: 80px;
                }

                .billing-cart-table col.billing-cart-col-total {
                    width: 130px;
                }

                .billing-cart-table col.billing-cart-col-action {
                    width: 56px;
                }

                .billing-cart-table th,
                .billing-cart-table td {
                    vertical-align: top;
                }

                .billing-cart-table th:not(:first-child),
                .billing-cart-table td:not(:first-child) {
                    text-align: center;
                }

                .billing-cart-service {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    min-width: 0;
                    padding-right: 16px;
                }

                .billing-cart-service-copy {
                    min-width: 0;
                    flex: 1;
                }

                .billing-cart-service-title {
                    display: block;
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1.45;
                    overflow-wrap: anywhere;
                }

                .billing-cart-service-description {
                    color: #64748b;
                    font-size: 13px;
                    margin: 4px 0 0;
                    line-height: 1.5;
                }

                .billing-cart-features {
                    margin: 10px 0 0;
                    padding: 0;
                    list-style: none;
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px 16px;
                }

                .billing-cart-feature {
                    color: #94a3b8;
                    font-size: 12px;
                    display: flex;
                    align-items: flex-start;
                    gap: 6px;
                    line-height: 1.5;
                    min-width: 0;
                }

                .billing-cart-value,
                .billing-cart-qty,
                .billing-cart-total {
                    white-space: nowrap;
                    padding-top: 28px !important;
                    font-variant-numeric: tabular-nums;
                }

                .billing-cart-total {
                    color: #60a5fa;
                    font-weight: 700;
                }

                .billing-cart-remove {
                    padding-top: 24px !important;
                }

                @media (max-width: 991px) {
                    .billing-cart-table col.billing-cart-col-price {
                        width: 110px;
                    }

                    .billing-cart-table col.billing-cart-col-qty {
                        width: 72px;
                    }

                    .billing-cart-table col.billing-cart-col-total {
                        width: 120px;
                    }

                    .billing-cart-features {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 767px) {
                    .billing-cart-table {
                        min-width: 760px;
                    }

                    .billing-cart-service {
                        padding-right: 8px;
                    }
                }
            `}</style>
            <section className="cart-page" style={{ padding: "40px 0" }}>
                <div className="container">
                    <div style={{ marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                            <div>
                                <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0 }}>
                                    Sepetiniz
                                </h2>
                                <p style={{ color: "#94a3b8", fontSize: 15, marginTop: 4 }}>
                                    Sectiginiz paket ve ek hizmetler asagida listelenmektedir.
                                </p>
                            </div>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => replaceCart(clearCart())}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "11px 16px",
                                        borderRadius: 12,
                                        border: "1px solid rgba(239,68,68,0.28)",
                                        background: "rgba(127,29,29,0.18)",
                                        color: "#fecaca",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Sepeti Temizle
                                </button>
                            )}
                        </div>
                        {!hasAuthSession() && (
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: "14px 16px",
                                    borderRadius: 14,
                                    border: "1px solid rgba(96,165,250,0.25)",
                                    background: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.08))",
                                    color: "#dbeafe",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                }}
                            >
                                Odeme adimina gecmeden once giris yapmaniz veya yeni bir hesap olusturmaniz gerekir.
                            </div>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-xl-8 col-lg-7">
                            <div className="cart-page__left">
                                <div className="table-responsive">
                                    <table
                                        className="table cart-table billing-cart-table"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            borderRadius: 16,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <colgroup>
                                            <col className="billing-cart-col-service" />
                                            <col className="billing-cart-col-price" />
                                            <col className="billing-cart-col-qty" />
                                            <col className="billing-cart-col-total" />
                                            <col className="billing-cart-col-action" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th style={{ color: "#94a3b8" }}>Hizmet</th>
                                                <th style={{ color: "#94a3b8" }}>Fiyat</th>
                                                <th style={{ color: "#94a3b8" }}>Adet</th>
                                                <th style={{ color: "#94a3b8" }}>Toplam</th>
                                                <th style={{ color: "#94a3b8" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={item.key || idx}>
                                                    <td>
                                                        <div className="product-box billing-cart-service">
                                                            <div
                                                                style={{
                                                                    width: 48,
                                                                    height: 48,
                                                                    borderRadius: 12,
                                                                    background: item.type === "package"
                                                                        ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                                                                        : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontSize: 20,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {item.type === "package" ? "📦" : "⚡"}
                                                            </div>
                                                            <div className="billing-cart-service-copy">
                                                                <h3 style={{ margin: 0 }}>
                                                                    <span className="billing-cart-service-title">{item.name}</span>
                                                                </h3>
                                                                {item.description && (
                                                                    <p className="billing-cart-service-description">
                                                                        {item.description}
                                                                    </p>
                                                                )}
                                                                {item.features && item.features.length > 0 && (
                                                                    <ul className="billing-cart-features">
                                                                        {item.features.map((feature, featureIndex) => (
                                                                            <li key={featureIndex} className="billing-cart-feature">
                                                                                <span style={{ color: "#22c55e", fontSize: 11 }}>✓</span>
                                                                                {feature}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="billing-cart-value" style={{ color: "#e2e8f0", fontWeight: 500 }}>{formatPrice(item.price)}</td>
                                                    <td className="billing-cart-qty" style={{ color: "#e2e8f0" }}>1</td>
                                                    <td className="billing-cart-total">{formatPrice(item.price)}</td>
                                                    <td className="billing-cart-remove">
                                                        {item.removable && (
                                                            <button
                                                                onClick={() => removeItem(item.key)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#ef4444",
                                                                    cursor: "pointer",
                                                                    fontSize: 16,
                                                                    padding: 4,
                                                                }}
                                                                title="Kaldir"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <Link
                                        href={PRICING_PAGE_HREF}
                                        style={{
                                            color: "#60a5fa",
                                            fontSize: 14,
                                            textDecoration: "none",
                                        }}
                                    >
                                        ← Paketlere Don
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-4 col-lg-5">
                            <div
                                className="cart-page__right"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 16,
                                    padding: 28,
                                }}
                            >
                                <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
                                    Siparis Ozeti
                                </h3>

                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{ marginBottom: 16 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                                                <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>{formatPrice(item.price)}</span>
                                            </div>
                                            {item.features && item.features.length > 0 && (
                                                <ul style={{
                                                    margin: "6px 0 0",
                                                    padding: "8px 12px",
                                                    listStyle: "none",
                                                    background: "rgba(255,255,255,0.03)",
                                                    borderRadius: 8,
                                                    borderLeft: "2px solid rgba(96,165,250,0.4)",
                                                }}>
                                                    {item.features.map((feature, featureIndex) => (
                                                        <li key={featureIndex} style={{
                                                            color: "#94a3b8",
                                                            fontSize: 12,
                                                            lineHeight: 1.8,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 5,
                                                        }}>
                                                            <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {item.description && !item.features?.length && (
                                                <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        borderTop: "1px solid rgba(255,255,255,0.15)",
                                        marginTop: 8,
                                        paddingTop: 16,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Toplam</span>
                                    <span style={{ color: "#60a5fa", fontSize: 22, fontWeight: 800 }}>{formatPrice(total)}</span>
                                </div>

                                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                            gap: 10,
                                        }}
                                    >
                                        {[
                                            {
                                                key: "card" as const,
                                                title: "Kart ile Odeme",
                                                text: "PayTR altyapisi kullanilmaktadir.",
                                            },
                                            {
                                                key: "eft" as const,
                                                title: "PayTR Havale / EFT",
                                                text: "PayTR Havale/EFT iframe'i ile EFT adimlarini tamamlayin.",
                                            },
                                            {
                                                key: "bank_transfer" as const,
                                                title: "Havale / EFT Bildirimi",
                                                text: "Banka transferi yapin, referans koduyla odeme bildirimi birakin.",
                                            },
                                        ].filter((method) => methodAvailability[method.key]?.enabled).map((method) => {
                                            const selected = paymentMethod === method.key;

                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(method.key)}
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "14px 14px 13px",
                                                        borderRadius: 14,
                                                        border: selected
                                                            ? "1px solid rgba(96,165,250,0.5)"
                                                            : "1px solid rgba(148,163,184,0.16)",
                                                        background: selected
                                                            ? "linear-gradient(135deg, rgba(30,64,175,0.28), rgba(14,165,233,0.18))"
                                                            : "rgba(255,255,255,0.03)",
                                                        color: "#fff",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{method.title}</div>
                                                    <div style={{ fontSize: 12, lineHeight: 1.5, color: selected ? "#dbeafe" : "#94a3b8", marginTop: 6 }}>
                                                        {method.text}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={startPayment}
                                        disabled={!packageId || startingPayment}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 10,
                                            padding: "14px 0",
                                            borderRadius: 12,
                                            background: startingPayment
                                                ? "rgba(96,165,250,0.16)"
                                                : "linear-gradient(135deg, #dc2626, #b91c1c)",
                                            color: "#fff",
                                            fontWeight: 700,
                                            fontSize: 16,
                                            border: "none",
                                            cursor: !packageId || startingPayment ? "not-allowed" : "pointer",
                                            width: "100%",
                                            opacity: packageId ? 1 : 0.7,
                                        }}
                                    >
                                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v1H0V4zm0 3v5a2 2 0 002 2h12a2 2 0 002-2V7H0zm3 2h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1a1 1 0 011-1z" />
                                        </svg>
                                        {startingPayment
                                            ? paymentMethod === "bank_transfer"
                                                ? "Talep Olusturuluyor..."
                                                : paymentMethod === "eft"
                                                    ? "EFT Ekrani Aciliyor..."
                                                : "Odeme Baslatiliyor..."
                                            : paymentMethod === "bank_transfer"
                                                ? "Havale / EFT Talebi Olustur"
                                                : paymentMethod === "eft"
                                                    ? "PayTR EFT Ile Devam Et"
                                                : "Odeme Ile Devam Et"}
                                    </button>

                                    <div
                                        style={{
                                            background: "rgba(96,165,250,0.08)",
                                            border: "1px solid rgba(96,165,250,0.2)",
                                            borderRadius: 10,
                                            padding: "12px 14px",
                                            color: "#bfdbfe",
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {paymentMethod === "bank_transfer"
                                            ? "Talep olusturulduktan sonra banka bilgileri ve referans kodu gosterilir. Transferi tamamlayinca odeme bildirimi gonderebilirsiniz."
                                            : paymentMethod === "eft"
                                                ? "Odeme baslatildiginda PayTR Havale/EFT iframe'i acilir. EFT adimlarini tamamladiginizda onay durumu callback ile islenir."
                                                : "Odeme baslatildiginda guvenli PayTR iframe'i acilir. Odeme tamamlandiginda onay ekranina yonlendirilirsiniz."}
                                    </div>

                                    {paymentError && (
                                        <div
                                            style={{
                                                background: "rgba(239,68,68,0.08)",
                                                border: "1px solid rgba(239,68,68,0.22)",
                                                borderRadius: 10,
                                                padding: "12px 14px",
                                                color: "#fecaca",
                                                fontSize: 13,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {paymentError}
                                        </div>
                                    )}

                                    {selectedAddonIds.length > 0 && (
                                        <div
                                            style={{
                                                background: "rgba(251,191,36,0.08)",
                                                border: "1px solid rgba(251,191,36,0.22)",
                                                borderRadius: 10,
                                                padding: "12px 14px",
                                                color: "#fde68a",
                                                fontSize: 13,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Sectiginiz ek hizmetler sadece 1 toplanti veya 1 event icin kullanilir. Kurum geneline surekli hak olarak tanimlanmaz.
                                        </div>
                                    )}

                                    {paymentMethod === "bank_transfer" && bankTransferRequest && (
                                        <div
                                            style={{
                                                background: "rgba(37,99,235,0.08)",
                                                border: "1px solid rgba(96,165,250,0.2)",
                                                borderRadius: 12,
                                                padding: "12px 14px",
                                                color: "#dbeafe",
                                                fontSize: 13,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Havale / EFT talebiniz hazir. Ayrintilar popup pencerede acilir.
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
                                    <svg width="14" height="14" fill="#22c55e" viewBox="0 0 16 16">
                                        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.354 6.354l-4 4a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L7 9.293l3.646-3.647a.5.5 0 01.708.708z" />
                                    </svg>
                                    <span style={{ color: "#64748b", fontSize: 12 }}>
                                        Ana paket callback sonrasi otomatik aktive edilir
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BillingAuthModal
                open={authModalOpen}
                onClose={() => {
                    setAuthModalOpen(false);
                    setResumeCheckoutAfterAuth(false);
                }}
                onAuthenticated={handleAuthenticated}
                returnPath={buildReturnPath()}
            />

            {activePaymentMethod === "bank_transfer" && bankTransferRequest && (
                <div
                    onClick={closePaymentOverlay}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(2, 6, 23, 0.82)",
                        backdropFilter: "blur(10px)",
                        padding: "clamp(12px, 3vw, 32px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "min(860px, 100%)",
                            maxHeight: "min(88vh, 920px)",
                            overflowY: "auto",
                            borderRadius: 24,
                            border: "1px solid rgba(148,163,184,0.22)",
                            background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94))",
                            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 16,
                                padding: "18px 20px",
                                borderBottom: "1px solid rgba(148,163,184,0.16)",
                                background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
                            }}
                        >
                            <div>
                                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
                                    Havale / EFT Talebi
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                                    Once Garanti hesabini kullanin. Gerekirse diger banka hesaplarini da acabilirsiniz.
                                </div>
                            </div>
                            <button
                                onClick={closePaymentOverlay}
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    color: "#e2e8f0",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    padding: "10px 14px",
                                }}
                            >
                                Kapat
                            </button>
                        </div>

                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                                {[
                                    ["Referans Kodu", bankTransferRequest.referenceCode],
                                    ["Son Odeme Tarihi", formatDateTime(bankTransferRequest.expiresAt)],
                                    ["Paket", bankTransferRequest.package.name || "-"],
                                    ["Durum", bankTransferRequest.status],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(15,23,42,0.45)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                        <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{label}</div>
                                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {primaryBankAccount && (
                                <div style={{ borderRadius: 18, border: "1px solid rgba(96,165,250,0.28)", background: "linear-gradient(135deg, rgba(30,64,175,0.28), rgba(14,165,233,0.12))", padding: 18 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                        <div>
                                            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{primaryBankAccount.bankName || "-"}</div>
                                            <div style={{ color: "#bfdbfe", fontSize: 13, marginTop: 4 }}>Varsayilan banka hesabi</div>
                                        </div>
                                        <div style={{ color: "#dbeafe", fontSize: 12, fontWeight: 700, padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(191,219,254,0.26)", background: "rgba(255,255,255,0.06)" }}>
                                            Referans kodunu aciklamaya yazin
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
                                        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(15,23,42,0.36)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Hesap Sahibi</div>
                                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{primaryBankAccount.accountHolder || "-"}</div>
                                        </div>
                                        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(15,23,42,0.36)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>IBAN</div>
                                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>{primaryBankAccount.iban || "-"}</div>
                                        </div>
                                        {primaryBankAccount.branchName && (
                                            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(15,23,42,0.36)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Sube</div>
                                                <div style={{ color: "#e2e8f0", fontSize: 13 }}>{primaryBankAccount.branchName}</div>
                                            </div>
                                        )}
                                        {primaryBankAccount.branchCode && (
                                            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(15,23,42,0.36)", border: "1px solid rgba(148,163,184,0.12)" }}>
                                                <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Sube Kodu</div>
                                                <div style={{ color: "#e2e8f0", fontSize: 13 }}>{primaryBankAccount.branchCode}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {otherBankAccounts.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowOtherBankAccounts((current) => !current)}
                                        style={{
                                            alignSelf: "flex-start",
                                            background: "transparent",
                                            border: "none",
                                            color: "#60a5fa",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            padding: 0,
                                        }}
                                    >
                                        {showOtherBankAccounts ? "Diger banka hesaplarini gizle" : "Diger banka hesaplarini goster"}
                                    </button>

                                    {showOtherBankAccounts && (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                                            {otherBankAccounts.map((account) => (
                                                <div key={account.id || `${account.bankName}-${account.iban}`} style={{ padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.16)" }}>
                                                    <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{account.bankName || "-"}</div>
                                                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>Hesap Sahibi</div>
                                                    <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5 }}>{account.accountHolder || "-"}</div>
                                                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>IBAN</div>
                                                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word" }}>{account.iban || "-"}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <input
                                    value={bankTransferSenderName}
                                    onChange={(event) => setBankTransferSenderName(event.target.value)}
                                    placeholder="Gonderen adi soyadi"
                                    style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(15,23,42,0.55)", border: "1px solid rgba(148,163,184,0.2)", color: "#fff" }}
                                />
                                <input
                                    value={bankTransferSenderIban}
                                    onChange={(event) => setBankTransferSenderIban(event.target.value)}
                                    placeholder="Gonderen IBAN (opsiyonel)"
                                    style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(15,23,42,0.55)", border: "1px solid rgba(148,163,184,0.2)", color: "#fff" }}
                                />
                                <textarea
                                    value={bankTransferNote}
                                    onChange={(event) => setBankTransferNote(event.target.value)}
                                    placeholder="Dekont notu veya aciklama"
                                    rows={4}
                                    style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(15,23,42,0.55)", border: "1px solid rgba(148,163,184,0.2)", color: "#fff", resize: "vertical" }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={notifyBankTransfer}
                                disabled={notifyingBankTransfer}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "14px 16px",
                                    borderRadius: 14,
                                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: notifyingBankTransfer ? "not-allowed" : "pointer",
                                    opacity: notifyingBankTransfer ? 0.7 : 1,
                                }}
                            >
                                {notifyingBankTransfer ? "Bildirim Gonderiliyor..." : "Odeme Bildirimi Birak"}
                            </button>

                            {bankTransferMessage && (
                                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.24)", color: "#bbf7d0", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
                                    {bankTransferMessage}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {iframeUrl && (
                <div
                    onClick={closePaymentOverlay}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(2, 6, 23, 0.82)",
                        backdropFilter: "blur(10px)",
                        padding: "clamp(12px, 3vw, 32px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "min(1120px, 100%)",
                            height: "min(88vh, 920px)",
                            borderRadius: 24,
                            overflow: "hidden",
                            border: "1px solid rgba(148,163,184,0.22)",
                            background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94))",
                            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 16,
                                padding: "18px 20px",
                                borderBottom: "1px solid rgba(148,163,184,0.16)",
                                background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))",
                            }}
                        >
                            <div>
                                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
                                    {activePaymentMethod === "eft" ? "PayTR Havale / EFT Ekrani" : "Guvenli Kartli Odeme Ekrani"}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                                    {activePaymentMethod === "eft"
                                        ? "Isleminiz PayTR Havale/EFT iframe'i icinde islenir. EFT adimlarini tamamladiginizda durum otomatik guncellenir."
                                        : "Odemeniz PayTR guvenli iframe'i icinde islenir. Islemi tamamladiginizda otomatik olarak geri yonlendirilirsiniz."}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <a
                                    href={iframeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "10px 14px",
                                        borderRadius: 12,
                                        color: "#bfdbfe",
                                        textDecoration: "none",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        background: "rgba(96,165,250,0.12)",
                                        border: "1px solid rgba(96,165,250,0.24)",
                                    }}
                                >
                                    Yeni Sekmede Ac
                                </a>
                                <button
                                    onClick={closePaymentOverlay}
                                    style={{
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        color: "#e2e8f0",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        borderRadius: 12,
                                        padding: "10px 14px",
                                    }}
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                minHeight: 0,
                                background: "#fff",
                            }}
                        >
                            <iframe
                                title={activePaymentMethod === "eft" ? "PayTR Havale / EFT" : "PayTR Odeme"}
                                src={iframeUrl}
                                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                                allow="payment"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
