"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { trpc } from "../../../utils/trpc";
import { AuthPageShell } from "../../../components/auth/AuthPageShell";
import {
    clearLegacyAuthStorage,
    fetchPortalAuthSession,
    storeLegacyUserName,
} from "../../../utils/authSession";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* If user already has a valid session, skip login */
    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (!mounted) return;
                if (session.authenticated && session.organizationId) {
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

    const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
        onSuccess: () =>
            setResendStatus(
                "Doğrulama e-postası tekrar gönderildi (eğer bu e-posta kayıtlıysa)."
            ),
        onError: (err) => setResendStatus(err.message),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setResendStatus(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                clearLegacyAuthStorage();
                setErrorMessage(
                    data?.error || "Giriş sırasında bir hata oluştu.",
                );
                return;
            }

            clearLegacyAuthStorage();
            storeLegacyUserName(data?.user?.name ?? null);
            window.location.href = "/dashboard";
        } catch {
            setErrorMessage("Giriş sırasında bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isUnverifiedEmailError = (errorMessage || "")
        .toLowerCase()
        .includes("doğrulan");

    return (
        <AuthPageShell title="Giriş Yap">
            <section className="login-one">
                <div className="container">
                    <div className="login-one__form">
                        <div className="inner-title text-center">
                            <h2>Giriş Yap</h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Error alert */}
                            {errorMessage && (
                                <div
                                    style={{
                                        display: "block",
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        marginBottom: "16px",
                                        fontSize: "14px",
                                        background: "rgba(239,68,68,0.15)",
                                        color: "#ef4444",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                    }}
                                >
                                    {errorMessage}
                                    {isUnverifiedEmailError && (
                                        <div style={{ marginTop: "12px" }}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    resendMutation.mutate({ email })
                                                }
                                                disabled={
                                                    !email || resendMutation.isPending
                                                }
                                                style={{
                                                    textDecoration: "underline",
                                                    color: "#ef4444",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {resendMutation.isPending
                                                    ? "Doğrulama e-postası gönderiliyor..."
                                                    : "Doğrulama e-postasını tekrar gönder"}
                                            </button>
                                            <br />
                                            <Link
                                                href={`/check-email?email=${encodeURIComponent(email)}`}
                                                style={{
                                                    textDecoration: "underline",
                                                    color: "#ef4444",
                                                }}
                                            >
                                                E-postayı kontrol et sayfası
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {resendStatus && (
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        borderRadius: "8px",
                                        marginBottom: "16px",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    {resendStatus}
                                </div>
                            )}

                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                type="text"
                                                placeholder="E-posta veya Kullanıcı Adı"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                required
                                                autoComplete="username"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <div className="input-box">
                                            <input
                                                type="password"
                                                placeholder="Şifre"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                required
                                                autoComplete="current-password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="form-group">
                                        <button
                                            className="thm-btn"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? "Giriş Yapılıyor..."
                                                : "Giriş Yap"}
                                            <span className="icon-right-arrow"></span>
                                        </button>
                                    </div>
                                </div>

                                <div className="remember-forget">
                                    <div className="checked-box1">
                                        <input
                                            type="checkbox"
                                            name="saveMyInfo"
                                            id="saveinfo"
                                            defaultChecked
                                        />
                                        <label htmlFor="saveinfo">
                                            <span></span>
                                            Beni hatırla
                                        </label>
                                    </div>
                                    <div className="forget">
                                        <Link href="/forgot-password">
                                            Şifremi unuttum?
                                        </Link>
                                    </div>
                                </div>

                                <div className="create-account text-center">
                                    <p>
                                        Hesabınız yok mu?{" "}
                                        <Link href="/register">Kayıt Ol</Link>
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
