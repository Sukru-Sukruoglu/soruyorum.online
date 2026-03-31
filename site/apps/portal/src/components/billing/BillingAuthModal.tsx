"use client";

import Link from "next/link";
import { useState } from "react";
import {
    clearLegacyAuthStorage,
    storeLegacyUserName,
} from "@/utils/authSession";

type BillingAuthModalProps = {
    open: boolean;
    onClose: () => void;
    onAuthenticated: () => void;
    returnPath: string;
};

type RegisterAdminInput = {
    name: string;
    organizationName: string;
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

export function BillingAuthModal({ open, onClose, onAuthenticated, returnPath }: BillingAuthModalProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);

    const [registerError, setRegisterError] = useState<string | null>(null);
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [explicitConsentAccepted, setExplicitConsentAccepted] = useState(false);

    const [loginPending, setLoginPending] = useState(false);
    const [registerPending, setRegisterPending] = useState(false);

    if (!open) return null;

    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoginError(null);
        setLoginPending(true);
        void fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    clearLegacyAuthStorage();
                    setLoginError(data?.error || "Giriş sırasında hata oluştu.");
                    return;
                }
                clearLegacyAuthStorage();
                storeLegacyUserName(data?.user?.name ?? null);
                setLoginError(null);
                onAuthenticated();
            })
            .catch(() => {
                setLoginError("Giriş sırasında hata oluştu.");
            })
            .finally(() => {
                setLoginPending(false);
            });
    };

    const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRegisterError(null);

        if (!kvkkAccepted || !explicitConsentAccepted) {
            setRegisterError("Devam etmek için KVKK ve Açık Rıza onayları gereklidir.");
            return;
        }

        const formData = new FormData(event.currentTarget);
        const firstName = ((formData.get("firstName") as string | null) ?? "").trim();
        const lastName = ((formData.get("lastName") as string | null) ?? "").trim();
        const fullName = `${firstName} ${lastName}`.trim();
        const phoneRaw = ((formData.get("phone") as string | null) ?? "").trim();
        const email = ((formData.get("email") as string | null) ?? "").trim();
        const password = (formData.get("password") as string | null) ?? "";

        if (!isCorporateEmail(email)) {
            setRegisterError(CORPORATE_EMAIL_ERROR);
            return;
        }

        const payload: RegisterAdminInput = {
            name: fullName,
            organizationName: fullName,
            email,
            password,
            phone: phoneRaw || undefined,
            kvkkAccepted: true,
            explicitConsentAccepted: true,
            consentVersion: "v1",
        };

        setRegisterPending(true);
        void fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify(payload),
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    clearLegacyAuthStorage();
                    setRegisterError(data?.error || "Kayıt sırasında hata oluştu.");
                    return;
                }

                clearLegacyAuthStorage();
                storeLegacyUserName(data?.user?.name ?? null);
                setRegisterError(null);

                if (data?.verificationRequired) {
                    window.location.href = `/check-email?email=${encodeURIComponent(data.user.email)}`;
                    return;
                }

                onAuthenticated();
            })
            .catch(() => {
                setRegisterError("Kayıt sırasında hata oluştu.");
            })
            .finally(() => {
                setRegisterPending(false);
            });
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(2, 6, 23, 0.78)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
        >
            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 560,
                    borderRadius: 24,
                    border: "1px solid rgba(148,163,184,0.18)",
                    background: "linear-gradient(180deg, #081225 0%, #0f1b33 100%)",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                    overflow: "hidden",
                }}
            >
                <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div>
                            <div style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700, letterSpacing: 0.6 }}>
                                ABONELIK DOGRULAMA
                            </div>
                            <h3 style={{ color: "#fff", fontSize: 28, lineHeight: 1.1, margin: "10px 0 8px", fontWeight: 800 }}>
                                Odeme oncesi giris veya kayit
                            </h3>
                            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
                                Mevcut uyeyseniz giris yapin. Yeni uyeyseniz once hesabinizi olusturun, fatura ve sirket bilgilerini sonradan hesabinizdan tamamlarsiniz.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                border: "1px solid rgba(148,163,184,0.16)",
                                background: "rgba(255,255,255,0.04)",
                                color: "#cbd5e1",
                                cursor: "pointer",
                                fontSize: 18,
                            }}
                            aria-label="Kapat"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div style={{ padding: 24 }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                            marginBottom: 22,
                            background: "rgba(255,255,255,0.03)",
                            padding: 6,
                            borderRadius: 16,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setMode("login")}
                            style={{
                                padding: "12px 16px",
                                borderRadius: 12,
                                border: "none",
                                background: mode === "login" ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "transparent",
                                color: "#fff",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Giris Yap
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("register")}
                            style={{
                                padding: "12px 16px",
                                borderRadius: 12,
                                border: "none",
                                background: mode === "register" ? "linear-gradient(135deg, #0ea5e9, #2563eb)" : "transparent",
                                color: "#fff",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Yeni Uyelik
                        </button>
                    </div>

                    {mode === "login" ? (
                        <form onSubmit={handleLoginSubmit}>
                            {loginError && (
                                <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 14 }}>
                                    {loginError}
                                </div>
                            )}

                            <div style={{ display: "grid", gap: 12 }}>
                                <input
                                    type="email"
                                    placeholder="E-posta Adresi"
                                    value={loginEmail}
                                    onChange={(event) => setLoginEmail(event.target.value)}
                                    required
                                    autoComplete="email"
                                    style={inputStyle}
                                />
                                <input
                                    type="password"
                                    placeholder="Sifre"
                                    value={loginPassword}
                                    onChange={(event) => setLoginPassword(event.target.value)}
                                    required
                                    autoComplete="current-password"
                                    style={inputStyle}
                                />
                            </div>

                            <button type="submit" disabled={loginPending} style={primaryButtonStyle(loginPending)}>
                                {loginPending ? "Giris yapiliyor..." : "Giris Yap ve Odemeye Gec"}
                            </button>

                            <div style={{ marginTop: 14, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                                <Link href={`/login?redirect=${encodeURIComponent(returnPath)}`} style={{ color: "#60a5fa", textDecoration: "none" }}>
                                    Tam sayfa giris ac
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit}>
                            {registerError && (
                                <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 14 }}>
                                    {registerError}
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <input name="firstName" type="text" placeholder="Ad" required autoComplete="given-name" style={inputStyle} />
                                <input name="lastName" type="text" placeholder="Soyad" required autoComplete="family-name" style={inputStyle} />
                            </div>
                            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                                <input name="email" type="email" placeholder="E-posta Adresi" required autoComplete="email" style={inputStyle} />
                                <input name="phone" type="tel" placeholder="Telefon (Opsiyonel)" autoComplete="tel" style={inputStyle} />
                                <input name="password" type="password" placeholder="Sifre" required autoComplete="new-password" style={inputStyle} />
                            </div>

                            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#bfdbfe", fontSize: 13, lineHeight: 1.5 }}>
                                Sirket, fatura ve abonelik detaylarini uye olduktan sonra hesap ekraninizdan yonetebilirsiniz.
                            </div>

                            <label style={checkboxRowStyle}>
                                <input type="checkbox" checked={kvkkAccepted} onChange={(event) => setKvkkAccepted(event.target.checked)} />
                                <span>
                                    <Link href="/kvkk" style={inlineLinkStyle}>KVKK Aydinlatma Metni</Link> okudum.
                                </span>
                            </label>
                            <label style={checkboxRowStyle}>
                                <input type="checkbox" checked={explicitConsentAccepted} onChange={(event) => setExplicitConsentAccepted(event.target.checked)} />
                                <span>
                                    <Link href="/acik-riza" style={inlineLinkStyle}>Acik Riza Metni</Link> onayliyorum.
                                </span>
                            </label>

                            <button type="submit" disabled={registerPending} style={secondaryButtonStyle(registerPending)}>
                                {registerPending ? "Kayit olusturuluyor..." : "Uyelik Olustur ve Odemeye Gec"}
                            </button>

                            <div style={{ marginTop: 14, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                                <Link href={`/register?redirect=${encodeURIComponent(returnPath)}`} style={{ color: "#60a5fa", textDecoration: "none" }}>
                                    Tam sayfa kayit ac
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.78)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
};

const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    color: "#cbd5e1",
    fontSize: 13,
};

const inlineLinkStyle: React.CSSProperties = {
    color: "#60a5fa",
    textDecoration: "none",
};

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
    return {
        width: "100%",
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "rgba(220,38,38,0.45)" : "linear-gradient(135deg, #dc2626, #b91c1c)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "wait" : "pointer",
    };
}

function secondaryButtonStyle(disabled: boolean): React.CSSProperties {
    return {
        width: "100%",
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "rgba(14,165,233,0.45)" : "linear-gradient(135deg, #0ea5e9, #2563eb)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "wait" : "pointer",
    };
}