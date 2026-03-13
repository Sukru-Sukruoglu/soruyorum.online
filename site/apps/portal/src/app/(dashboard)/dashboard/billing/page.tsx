"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/services/api";

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
    name: string;
    description?: string;
    features?: string[];
    price: number; // TL cinsinden
    removable?: boolean;
    type: "package" | "addon";
    addonId?: "addon_remote" | "addon_onsite";
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
    const searchParams = useSearchParams();
    const packageId = searchParams.get("package") || "";
    const addonRemote = searchParams.get("addon_remote") === "1";
    const addonOnsite = searchParams.get("addon_onsite") === "1";

    const [sections, setSections] = useState<PricingSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<CartItem[]>([]);
    const [startingPayment, setStartingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);

    /* Fiyatlandırma verilerini getir */
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/trpc/settings.getPricing?input=%7B%7D&batch=1");
                const json = await res.json();
                const data = json?.[0]?.result?.data;
                if (data && typeof data === "object" && Array.isArray(data.sections)) {
                    setSections(data.sections);
                }
            } catch {
                // fallback: boş bırak
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* Seçilen paketi bul ve cart öğelerini oluştur */
    useEffect(() => {
        if (loading || sections.length === 0) return;

        const newItems: CartItem[] = [];

        let found: PricingCard | null = null;
        for (const sec of sections) {
            for (const card of sec.cards) {
                if (card.packageId === packageId) {
                    found = card;
                    break;
                }
            }
            if (found) break;
        }

        if (found) {
            newItems.push({
                name: found.title,
                description: found.support,
                features: found.features,
                price: parsePriceTL(found.price),
                type: "package",
            });
        }

        if (addonRemote) {
            newItems.push({
                name: "Remote Event Operator",
                description: "Uzaktan etkinlik yönetimi ve canli teknik destek. Sadece 1 toplanti veya 1 event icin gecerlidir.",
                price: ADDON_REMOTE_PRICE,
                removable: true,
                type: "addon",
                addonId: "addon_remote",
            });
        }

        if (addonOnsite) {
            newItems.push({
                name: "On-site Event Operator",
                description: "Yerinde profesyonel operator ve tam kurulum destegi. Sadece 1 toplanti veya 1 event icin gecerlidir.",
                price: ADDON_ONSITE_PRICE,
                removable: true,
                type: "addon",
                addonId: "addon_onsite",
            });
        }

        setItems(newItems);
    }, [loading, sections, packageId, addonRemote, addonOnsite]);

    const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);
    const total = subtotal;
    const selectedAddonIds = useMemo(() => {
        return items
            .map((item) => item.addonId)
            .filter((value): value is "addon_remote" | "addon_onsite" => Boolean(value));
    }, [items]);

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const formatPrice = (n: number) =>
        n.toLocaleString("tr-TR", { minimumFractionDigits: 0 }) + " TL";

    const startPayment = async () => {
        if (!packageId) {
            setPaymentError("Lutfen once bir paket secin.");
            return;
        }

        try {
            setStartingPayment(true);
            setPaymentError(null);

            const response = await apiClient.post("/api/payments/paytr/iframe/token", {
                packageId,
                addons: selectedAddonIds,
            });

            const nextIframeUrl = response.data?.iframeUrl as string | undefined;
            if (!nextIframeUrl) {
                throw new Error("PayTR iframe URL alinamadi");
            }

            setIframeUrl(nextIframeUrl);
        } catch (error: any) {
            setPaymentError(error?.response?.data?.error || error?.message || "Odeme baslatilamadi");
        } finally {
            setStartingPayment(false);
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
        <section className="cart-page" style={{ padding: "40px 0" }}>
            <div className="container">
                {/* Başlık */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0 }}>
                        Sepetiniz
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: 15, marginTop: 4 }}>
                        Seçtiğiniz paket ve ek hizmetler aşağıda listelenmektedir.
                    </p>
                </div>

                <div className="row">
                    {/* ── Sol: Ürün Tablosu ── */}
                    <div className="col-xl-8 col-lg-7">
                        <div className="cart-page__left">
                            <div className="table-responsive">
                                <table
                                    className="table cart-table"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        borderRadius: 16,
                                        overflow: "hidden",
                                    }}
                                >
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
                                            <tr key={idx}>
                                                <td>
                                                    <div className="product-box" style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                                                                <span style={{ color: "#fff" }}>{item.name}</span>
                                                            </h3>
                                                            {item.description && (
                                                                <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0" }}>
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                            {item.features && item.features.length > 0 && (
                                                                <ul style={{
                                                                    margin: "8px 0 0",
                                                                    padding: 0,
                                                                    listStyle: "none",
                                                                    display: "flex",
                                                                    flexWrap: "wrap",
                                                                    gap: "4px 12px",
                                                                }}>
                                                                    {item.features.map((f, fi) => (
                                                                        <li key={fi} style={{
                                                                            color: "#94a3b8",
                                                                            fontSize: 12,
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 4,
                                                                        }}>
                                                                            <span style={{ color: "#22c55e", fontSize: 11 }}>✓</span>
                                                                            {f}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ color: "#e2e8f0", fontWeight: 500 }}>
                                                    {formatPrice(item.price)}
                                                </td>
                                                <td style={{ color: "#e2e8f0" }}>1</td>
                                                <td style={{ color: "#60a5fa", fontWeight: 700 }}>
                                                    {formatPrice(item.price)}
                                                </td>
                                                <td>
                                                    {item.removable && (
                                                        <button
                                                            onClick={() => removeItem(idx)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#ef4444",
                                                                cursor: "pointer",
                                                                fontSize: 16,
                                                                padding: 4,
                                                            }}
                                                            title="Kaldır"
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

                            {/* Paketlere dön */}
                            <div style={{ marginTop: 16 }}>
                                <Link
                                    href={PRICING_PAGE_HREF}
                                    style={{
                                        color: "#60a5fa",
                                        fontSize: 14,
                                        textDecoration: "none",
                                    }}
                                >
                                    ← Paketlere Dön
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Sağ: Sipariş Özeti ── */}
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
                                Sipariş Özeti
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
                                            <span style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 500 }}>
                                                {item.name}
                                            </span>
                                            <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>
                                                {formatPrice(item.price)}
                                            </span>
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
                                                {item.features.map((f, fi) => (
                                                    <li key={fi} style={{
                                                        color: "#94a3b8",
                                                        fontSize: 12,
                                                        lineHeight: 1.8,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                    }}>
                                                        <span style={{ color: "#22c55e", fontSize: 10 }}>✓</span>
                                                        {f}
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
                                <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
                                    Toplam
                                </span>
                                <span style={{ color: "#60a5fa", fontSize: 22, fontWeight: 800 }}>
                                    {formatPrice(total)}
                                </span>
                            </div>

                            {/* ── Ödeme Butonu ── */}
                            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
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
                                        <path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v1H0V4zm0 3v5a2 2 0 002 2h12a2 2 0 002-2V7H0zm3 2h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1a1 1 0 011-1z"/>
                                    </svg>
                                    {startingPayment ? "Odeme Baslatiliyor..." : "Odeme Ile Devam Et"}
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
                                    Odeme baslatildiginda guvenli PayTR iframe'i asagida acilir. Odeme tamamlandiginda onay ekranina yonlendirilirsiniz.
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
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
                                <svg width="14" height="14" fill="#22c55e" viewBox="0 0 16 16">
                                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.354 6.354l-4 4a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L7 9.293l3.646-3.647a.5.5 0 01.708.708z"/>
                                </svg>
                                <span style={{ color: "#64748b", fontSize: 12 }}>
                                    Ana paket callback sonrasi otomatik aktive edilir
                                </span>
                            </div>

                            {iframeUrl && (
                                <div style={{ marginTop: 20 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 10,
                                        }}
                                    >
                                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                                            Guvenli Odeme Ekrani
                                        </span>
                                        <button
                                            onClick={() => setIframeUrl(null)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#94a3b8",
                                                cursor: "pointer",
                                                fontSize: 13,
                                            }}
                                        >
                                            Kapat
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            borderRadius: 14,
                                            overflow: "hidden",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            background: "#fff",
                                        }}
                                    >
                                        <iframe
                                            title="PayTR Odeme"
                                            src={iframeUrl}
                                            style={{ width: "100%", minHeight: 620, border: "none" }}
                                            allow="payment"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
