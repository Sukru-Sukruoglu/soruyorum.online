"use client";

import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/services/api";
import { useCart } from "@/utils/useCart";

type PaymentAccess = {
  plan: string;
  hasActiveSubscription: boolean;
  isExpired: boolean;
  isFreeOrTrial: boolean;
  currentPeriodEnd?: string | null;
};

type DomainSetup = {
  enabled?: boolean;
  required?: boolean;
  completed?: boolean;
};

export default function BillingSuccessPage() {
  const { clear } = useCart();
  const [access, setAccess] = useState<PaymentAccess | null>(null);
  const [domainSetup, setDomainSetup] = useState<DomainSetup | null>(null);
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<
    "checking" | "active" | "pending" | "error"
  >("checking");

  const redirectToSubscription = () => {
    const nextUrl = domainSetup?.required
      ? "/dashboard/settings?tab=domainler&setup=system-subdomain&payment=success"
      : "/dashboard/settings?tab=abonelik&payment=success";

    try {
      if (window.top && window.top !== window.self) {
        window.top.location.replace(nextUrl);
        return;
      }
    } catch {
      // Cross-frame access may be blocked; fall back to same-window navigation.
    }

    window.location.replace(nextUrl);
  };

  useEffect(() => {
    document.body.classList.remove("mobile-menu-visible");
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";
    const root = pageRootRef.current;

    document.documentElement.style.overflow = "";
    document.documentElement.style.pointerEvents = "";

    const pageWrapper = document.querySelector(
      ".page-wrapper",
    ) as HTMLElement | null;
    if (pageWrapper) {
      pageWrapper.style.pointerEvents = "";
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>("body *"),
    );

    for (const element of candidates) {
      if (
        !root ||
        element === root ||
        element.contains(root) ||
        root.contains(element)
      ) {
        continue;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const zIndex = Number.parseInt(style.zIndex || "0", 10);
      const coversViewport =
        rect.width >= viewportWidth - 8 && rect.height >= viewportHeight - 8;

      if (style.position === "fixed" && coversViewport && zIndex >= 999) {
        element.remove();
      }
    }

    try {
      if (
        window.top &&
        window.top !== window.self &&
        window.top.location.pathname !== window.location.pathname
      ) {
        window.top.location.replace(window.location.href);
        return;
      }
    } catch {
      // If frame access is blocked, remain in the current window.
    }

    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 15;

    const pollAccess = async () => {
      attempt += 1;

      try {
        const response = await apiClient.get("/api/payments/access");
        const nextAccess = response.data?.access as PaymentAccess | undefined;
        const nextDomainSetup = response.data?.domainSetup as
          | DomainSetup
          | undefined;

        if (cancelled || !nextAccess) {
          return;
        }

        setAccess(nextAccess);
        setDomainSetup(nextDomainSetup ?? null);

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

  useEffect(() => {
    if (status === "active") {
      clear();

      const redirectTimer = window.setTimeout(() => {
        redirectToSubscription();
      }, 1600);

      return () => {
        window.clearTimeout(redirectTimer);
      };
    }
  }, [clear, status]);

  const content = useMemo(() => {
    if (status === "active") {
      return {
        icon: <CheckCircle2 size={24} className="mt-0.5" />,
        title: "Aktivasyon tamamlandi",
        text: domainSetup?.required
          ? `Odemeniz onaylandi ve ${access?.plan || "paket"} erisiminiz aktif. Simdi sistem subdomaininizi secmeniz gerekiyor; yonlendirme otomatik olarak domain kurulumuna yapilacak.`
          : `Odemeniz onaylandi ve ${access?.plan || "paket"} erisiminiz aktif. Abonelik detaylariniz aciliyor, yonlendirme otomatik olarak yapilacak.`,
        surfaceStyle: {
          borderColor: "#86efac",
          background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
          color: "#14532d",
        },
        textStyle: { color: "#166534" },
        buttonStyle: { color: "#166534" },
      };
    }

    if (status === "pending" || status === "checking") {
      return {
        icon:
          status === "checking" ? (
            <Loader2 size={24} className="mt-0.5 animate-spin" />
          ) : (
            <AlertCircle size={24} className="mt-0.5" />
          ),
        title:
          status === "checking"
            ? "Aktivasyon kontrol ediliyor"
            : "Odeme alindi, aktivasyon bekleniyor",
        text:
          status === "checking"
            ? "Odeme kaydiniz alindi. Paket aktivasyonu dogrulaniyor, lutfen sayfayi kapatmayin."
            : access?.currentPeriodEnd
              ? `Odemeniz alindi ancak aktivasyon henuz tamamlanmadi. Sistem erisim bilgisini guncellerken kisa bir gecikme yasaniyor olabilir. Gerekirse abonelik ekranindan tekrar kontrol edin.`
              : "Odemeniz kayda girdi ancak paket aktivasyonu icin odeme saglayicisindan gelen onay bekleniyor. Birkac dakika sonra tekrar kontrol edin; durum degismezse destek ekibine merchant OID ile iletin.",
        surfaceStyle: {
          borderColor: "#fbbf24",
          background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
          color: "#78350f",
        },
        textStyle: { color: "#92400e" },
        buttonStyle: { color: "#78350f" },
      };
    }

    return {
      icon: <AlertCircle size={24} className="mt-0.5" />,
      title: "Aktivasyon durumu okunamadi",
      text: "Odeme kaydi alinmis olabilir ancak aktivasyon durumu bu anda dogrulanamadi. Abonelik ekranindan kontrol edin.",
      surfaceStyle: {
        borderColor: "#fca5a5",
        background: "linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)",
        color: "#7f1d1d",
      },
      textStyle: { color: "#991b1b" },
      buttonStyle: { color: "#7f1d1d" },
    };
  }, [access?.plan, domainSetup?.required, status]);

  return (
    <div
      ref={pageRootRef}
      className="flex min-h-[calc(100vh-180px)] items-center justify-center p-8"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border p-8 shadow-sm"
        style={content.surfaceStyle}
      >
        <div className="flex items-start gap-3">
          {content.icon}
          <div>
            <h1 className="text-2xl font-black" style={{ color: "inherit" }}>
              {content.title}
            </h1>
            <p className="mt-2 text-sm" style={content.textStyle}>
              {content.text}
            </p>
            {status !== "active" && access === null ? null : status !== "active" ? (
              <p className="mt-3 text-xs font-semibold" style={content.textStyle}>
                Odeme referansi: aktivasyon callback'i gelmediyse abonelik ekraninda durum beklemede kalir.
              </p>
            ) : null}
            <div className="mt-6">
              <button
                type="button"
                onClick={redirectToSubscription}
                className="text-sm font-semibold underline"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  ...content.buttonStyle,
                }}
              >
                Abonelik ekranına git
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
