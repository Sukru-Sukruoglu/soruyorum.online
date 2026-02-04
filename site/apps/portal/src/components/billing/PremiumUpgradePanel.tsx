"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, ShieldCheck, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@ks-interaktif/ui";
import { apiClient } from "@/services/api";
import { getRoleFromToken, isSuperAdminRole } from "@/utils/auth";

type OrganizationAccess = {
    plan: string;
    hasActiveSubscription: boolean;
    trialEndsAt: string;
    isTrialActive: boolean;
    isExpired: boolean;
    isFreeOrTrial: boolean;
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
    const [error, setError] = useState<string | null>(null);

    const premiumPriceLabel = useMemo(() => {
        return process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "120 USD";
    }, []);

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

    const startPaytr = async () => {
        try {
            setStartingPayment(true);
            setError(null);
            const r = await apiClient.post("/api/payments/paytr/iframe/token", {});
            const url = r.data?.iframeUrl as string | undefined;
            if (!url) {
                throw new Error("PayTR iframe URL alınamadı");
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

    useEffect(() => {
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            setRole(getRoleFromToken(token));
        } catch {
            setRole(null);
        }
        fetchAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (autoStartPayment) {
            startPaytr();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStartPayment]);

    const isSuperAdmin = isSuperAdminRole(role);

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
                        <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-500" /> PayTR ile ödeme
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-gray-500" /> Güvenli işlem
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={startPaytr}
                            disabled={startingPayment || isSuperAdmin}
                            className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2 shadow-lg shadow-red-900/20 border-0 rounded-full px-6 py-5"
                        >
                            {isSuperAdmin ? "Süper Admin" : startingPayment ? "Açılıyor..." : "Ödeme Yap"}
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
                    {!iframeUrl ? (
                        <div className="text-gray-500 text-sm">
                            {isSuperAdmin
                                ? "Süper Admin hesabında ödeme gerekmez."
                                : "Soldan “Ödeme Yap” ile ödeme ekranını açabilirsiniz."}
                        </div>
                    ) : (
                        <div className="w-full">
                            <iframe
                                title="PayTR Ödeme"
                                src={iframeUrl}
                                className="w-full rounded-xl border border-gray-200"
                                style={{ height: 720 }}
                            />
                            <div className="text-xs text-gray-500 mt-3">
                                Ödeme tamamlandıktan sonra Premium erişiminiz otomatik aktive olur.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
