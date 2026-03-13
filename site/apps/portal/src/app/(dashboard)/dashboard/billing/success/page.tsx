"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/services/api";

type PaymentAccess = {
    plan: string;
    hasActiveSubscription: boolean;
    isExpired: boolean;
    isFreeOrTrial: boolean;
    currentPeriodEnd?: string | null;
};

export default function BillingSuccessPage() {
    const [access, setAccess] = useState<PaymentAccess | null>(null);
    const [status, setStatus] = useState<"checking" | "active" | "pending" | "error">("checking");

    useEffect(() => {
        let cancelled = false;
        let attempt = 0;
        const maxAttempts = 15;

        const pollAccess = async () => {
            attempt += 1;

            try {
                const response = await apiClient.get("/api/payments/access");
                const nextAccess = response.data?.access as PaymentAccess | undefined;

                if (cancelled || !nextAccess) {
                    return;
                }

                setAccess(nextAccess);

                const activated =
                    nextAccess.hasActiveSubscription &&
                    !nextAccess.isExpired &&
                    String(nextAccess.plan || "").toLowerCase() !== "free";

                if (activated) {
                    setStatus("active");
                    return;
                }

                if (attempt >= maxAttempts) {
                    setStatus("pending");
                    return;
                }

                window.setTimeout(pollAccess, 3000);
            } catch {
                if (!cancelled) {
                    setStatus("error");
                }
            }
        };

        // Give the callback a short head start before the first read.
        const initialTimer = window.setTimeout(pollAccess, 1500);

        return () => {
            cancelled = true;
            window.clearTimeout(initialTimer);
        };
    }, []);

    const content = useMemo(() => {
        if (status === "active") {
            return {
                icon: <CheckCircle2 size={24} className="mt-0.5" />,
                title: "Aktivasyon tamamlandi",
                text: `Odemeniz onaylandi ve ${access?.plan || "paket"} erisiminiz aktif. Abonelik detaylarinizi hesap ekranindan takip edebilirsiniz.`,
                className: "border-green-200 bg-green-50 text-green-900",
                textClassName: "text-green-800",
            };
        }

        if (status === "pending" || status === "checking") {
            return {
                icon: status === "checking" ? <Loader2 size={24} className="mt-0.5 animate-spin" /> : <AlertCircle size={24} className="mt-0.5" />,
                title: status === "checking" ? "Aktivasyon kontrol ediliyor" : "Odeme alindi, aktivasyon bekleniyor",
                text:
                    status === "checking"
                        ? "Odeme kaydiniz alindi. Paket aktivasyonu dogrulaniyor, lutfen sayfayi kapatmayin."
                        : access?.currentPeriodEnd
                            ? `Odemeniz alindi ancak aktivasyon henuz tamamlanmadi. Sistem erisim bilgisini guncellerken kisa bir gecikme yasaniyor olabilir. Gerekirse abonelik ekranindan tekrar kontrol edin.`
                            : "Odemeniz alindi ancak aktivasyon henuz tamamlanmadi. Biraz sonra abonelik ekranindan tekrar kontrol edebilirsiniz.",
                className: "border-amber-200 bg-amber-50 text-amber-900",
                textClassName: "text-amber-800",
            };
        }

        return {
            icon: <AlertCircle size={24} className="mt-0.5" />,
            title: "Aktivasyon durumu okunamadi",
            text: "Odeme kaydi alinmis olabilir ancak aktivasyon durumu bu anda dogrulanamadi. Abonelik ekranindan kontrol edin.",
            className: "border-red-200 bg-red-50 text-red-900",
            textClassName: "text-red-800",
        };
    }, [access?.plan, status]);

    return (
        <div className="p-8">
            <div className={`max-w-2xl rounded-2xl border p-8 ${content.className}`}>
                <div className="flex items-start gap-3">
                    {content.icon}
                    <div>
                        <h1 className="text-2xl font-black">{content.title}</h1>
                        <p className={`mt-2 text-sm ${content.textClassName}`}>
                            {content.text}
                        </p>
                        <div className="mt-6">
                            <Link href="/dashboard/settings?tab=abonelik" className="text-sm font-semibold underline">
                                Abonelik ekranına git
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
