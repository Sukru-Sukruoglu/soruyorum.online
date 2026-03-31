"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPageShell } from "../../../components/auth/AuthPageShell";
import {
    clearLegacyAuthStorage,
    fetchPortalAuthSession,
    storeLegacyUserName,
} from "../../../utils/authSession";

type RegisterAdminInput = {
    name: string;
    organizationName: string;
    company?: string;
    email: string;
    password: string;
    phone?: string;
    kvkkAccepted: true;
    explicitConsentAccepted: true;
    consentVersion: "v1";
};

const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.com.tr",
    "ymail.com",
    "hotmail.com",
    "hotmail.com.tr",
    "outlook.com",
    "outlook.com.tr",
    "live.com",
    "live.com.tr",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "gmx.com",
    "yandex.com",
    "yandex.ru",
    "mail.com",
    "zoho.com",
    "inbox.com",
]);

function isCorporateEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split("@")[1] ?? "";
    return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}

const CORPORATE_EMAIL_ERROR = "Lutfen sirketinize ait kurumsal e-posta adresi kullanin. Gmail, Hotmail, Outlook ve benzeri kisisel adreslerle kayit kabul edilmiyor.";

export default function RegisterPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [explicitConsentAccepted, setExplicitConsentAccepted] = useState(false);
    const [lastPayload, setLastPayload] = useState<RegisterAdminInput | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);
    const [pendingSince, setPendingSince] = useState<number | null>(null);
    const [pendingTick, setPendingTick] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* If user already has a valid session, skip registration */
    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (!mounted) return;
                if (session.authenticated) {
                    window.location.href = "/dashboard";
                }
            })
            .catch(() => {
                /* ignore */
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (isSubmitting) {
            setPendingSince(Date.now());
            return;
        }
        setPendingSince(null);
    }, [isSubmitting]);

    useEffect(() => {
        if (!isSubmitting) return;
        const timer = setInterval(() => setPendingTick((t) => t + 1), 500);
        return () => clearInterval(timer);
    }, [isSubmitting]);

    const pendingSeconds = useMemo(() => {
        if (!pendingSince) return 0;
        void pendingTick;
        return Math.floor((Date.now() - pendingSince) / 1000);
    }, [pendingSince, pendingTick]);

    const showRetry = Boolean(uiError) || (isSubmitting && pendingSeconds >= 12);

    const phoneInputStyle: React.CSSProperties = {
        position: "relative",
        display: "block",
        width: "100%",
        height: "60px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(255,255,255,0.05)",
        color: "#cbd5e1",
        fontSize: "16px",
        fontWeight: 400,
        paddingLeft: "30px",
        paddingRight: "30px",
        outline: "none",
        boxSizing: "border-box",
        WebkitAppearance: "none",
        appearance: "none",
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUiError(null);

        if (!kvkkAccepted || !explicitConsentAccepted) {
            alert("Devam etmek için KVKK ve Açık Rıza metinlerini onaylamanız gerekir.");
            return;
        }

        const formData = new FormData(e.target as HTMLFormElement);
        const name = `${formData.get("firstName")} ${formData.get("lastName")}`;
        const organizationNameRaw = ((formData.get("organizationName") as string | null) ?? "").trim();
        const organizationName = organizationNameRaw || `${formData.get("firstName")} ${formData.get("lastName")}`;
        const companyRaw = (formData.get("company") as string | null) ?? "";
        const company = companyRaw.trim();
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const phoneValue = phone.trim();

        if (!isCorporateEmail(email)) {
            setUiError(CORPORATE_EMAIL_ERROR);
            return;
        }

        const payload: RegisterAdminInput = {
            name,
            organizationName,
            company: company ? company : undefined,
            email,
            password,
            phone: phoneValue ? phoneValue : undefined,
            kvkkAccepted: true,
            explicitConsentAccepted: true,
            consentVersion: "v1",
        };

        setLastPayload(payload);
        void submitRegistration(payload);
    };

    const handleRetry = () => {
        if (isSubmitting) return;
        if (!lastPayload) {
            setUiError("Tekrar denemek için formu yeniden gönderin.");
            return;
        }

        setUiError(null);
        void submitRegistration(lastPayload);
    };

    const submitRegistration = async (payload: RegisterAdminInput) => {
        setUiError(null);
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                clearLegacyAuthStorage();
                setUiError(data?.error || "Kayıt sırasında bir hata oluştu.");
                return;
            }

            clearLegacyAuthStorage();
            storeLegacyUserName(data?.user?.name ?? null);

            if (data?.verificationRequired) {
                router.push(`/check-email?email=${encodeURIComponent(data.user.email)}`);
                return;
            }

            window.location.href = "/dashboard";
        } catch {
            setUiError("Kayıt sırasında bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthPageShell title="Kayıt Ol">
            <style jsx>{`
                .register-phone-input::placeholder {
                    color: #94a3b8;
                }

                .register-phone-input:focus {
                    border-color: #0f172a !important;
                    background-color: #0f172a !important;
                }

                @media (max-width: 767px) {
                    .register-phone-input {
                        height: 50px !important;
                        font-size: 14px !important;
                        padding-left: 15px !important;
                        padding-right: 15px !important;
                    }
                }
            `}</style>
            <section className="login-one">
                <div className="container">
                    <div className="login-one__form" style={{ position: "relative" }}>
                        {/* Loading overlay */}
                        {isSubmitting && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 10,
                                    background: "rgba(255,255,255,0.85)",
                                    backdropFilter: "blur(4px)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "24px",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        border: "4px solid #e5e7eb",
                                        borderTopColor: "#dc2626",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                                <div style={{ marginTop: 16, fontWeight: 600, color: "#111" }}>
                                    Kayıt işlemi yapılıyor…
                                </div>
                                <div style={{ marginTop: 4, fontSize: 14, color: "#666" }}>
                                    Lütfen bekleyin. ({pendingSeconds}s)
                                </div>
                                {showRetry && (
                                    <div style={{ marginTop: 20, width: "100%" }}>
                                        <button
                                            className="thm-btn"
                                            type="button"
                                            onClick={handleRetry}
                                            style={{ width: "100%", background: "#111" }}
                                        >
                                            Yeniden Bağlan / Tekrar Dene
                                        </button>
                                        <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                                            Uzun sürdüyse bağlantı kopmuş olabilir.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="inner-title text-center">
                            <h2>Kayıt Ol</h2>
                        </div>

                        {/* Error alert */}
                        {uiError && (
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    marginBottom: "16px",
                                    fontSize: "14px",
                                    background: "rgba(239,68,68,0.15)",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                }}
                            >
                                {uiError}
                                {lastPayload && (
                                    <div style={{ marginTop: 12 }}>
                                        <button
                                            className="thm-btn"
                                            type="button"
                                            onClick={handleRetry}
                                            disabled={isSubmitting}
                                            style={{ fontSize: 14 }}
                                        >
                                            Tekrar Dene
                                            <span className="icon-right-arrow"></span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-xl-6">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="firstName"
                                                type="text"
                                                placeholder="Ad"
                                                required
                                                autoComplete="given-name"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-6">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="lastName"
                                                type="text"
                                                placeholder="Soyad"
                                                required
                                                autoComplete="family-name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="company"
                                                type="text"
                                                placeholder="Şirket (Opsiyonel)"
                                                autoComplete="organization"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="organizationName"
                                                type="text"
                                                placeholder="Organizasyon (Opsiyonel)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="Kurumsal E-posta Adresi"
                                                required
                                                autoComplete="email"
                                            />
                                        </div>
                                        <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                                            Gmail, Hotmail ve benzeri kisisel adreslerle kayit kabul edilmez.
                                        </p>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="phone"
                                                type="tel"
                                                className="register-phone-input"
                                                placeholder="Telefon (Opsiyonel)"
                                                autoComplete="tel-national"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={11}
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                                                style={phoneInputStyle}
                                            />
                                        </div>
                                        <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                                            Ornek: 05312345678
                                        </p>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                name="password"
                                                type="password"
                                                placeholder="Şifre"
                                                required
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* KVKK + Açık Rıza */}
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="checked-box1" style={{ marginBottom: 10 }}>
                                            <input
                                                type="checkbox"
                                                id="kvkk"
                                                checked={kvkkAccepted}
                                                onChange={(e) =>
                                                    setKvkkAccepted(e.target.checked)
                                                }
                                            />
                                            <label htmlFor="kvkk">
                                                <span></span>
                                                <Link href="/kvkk">KVKK Aydınlatma Metni</Link>
                                                {"'"}ni okudum ve anladım.
                                            </label>
                                        </div>
                                        <div className="checked-box1">
                                            <input
                                                type="checkbox"
                                                id="acik-riza"
                                                checked={explicitConsentAccepted}
                                                onChange={(e) =>
                                                    setExplicitConsentAccepted(
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <label htmlFor="acik-riza">
                                                <span></span>
                                                <Link href="/acik-riza">Açık Rıza Metni</Link>
                                                {"'"}ni okudum ve onaylıyorum.
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <button
                                            className="thm-btn"
                                            type="submit"
                                            disabled={
                                                isSubmitting ||
                                                !kvkkAccepted ||
                                                !explicitConsentAccepted
                                            }
                                        >
                                            {isSubmitting
                                                ? "Kayıt Olunuyor..."
                                                : "Hesap Oluştur"}
                                            <span className="icon-right-arrow"></span>
                                        </button>
                                    </div>
                                </div>

                                <div className="create-account text-center">
                                    <p>
                                        Zaten hesabınız var mı?{" "}
                                        <Link href="/login">Giriş Yap</Link>
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </AuthPageShell>
    );
}
