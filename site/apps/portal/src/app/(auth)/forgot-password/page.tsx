"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../../utils/trpc";
import { AuthPageShell } from "../../../components/auth/AuthPageShell";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const forgotMutation = trpc.auth.forgotPassword.useMutation({
        onSuccess: () => {
            setSent(true);
            setErrorMessage(null);
        },
        onError: (err) => {
            setErrorMessage(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        forgotMutation.mutate({ email });
    };

    return (
        <AuthPageShell title="Şifremi Unuttum">
            <section className="login-one">
                <div className="container">
                    <div className="login-one__form">
                        {sent ? (
                            <>
                                <div className="inner-title text-center">
                                    <h2>E-postanızı kontrol edin</h2>
                                </div>
                                <div style={{ textAlign: "center", padding: "20px 0" }}>
                                    <div
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: "50%",
                                            background: "rgba(34,197,94,0.1)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 16px",
                                        }}
                                    >
                                        <i
                                            className="fa fa-envelope"
                                            style={{ fontSize: 28, color: "#22c55e" }}
                                        ></i>
                                    </div>
                                    <p style={{ color: "#666", fontSize: 15 }}>
                                        Eğer <strong style={{ color: "#333" }}>{email}</strong>{" "}
                                        adresiyle kayıtlı bir hesap varsa, şifre sıfırlama
                                        bağlantısı gönderildi.
                                    </p>
                                </div>
                                <div className="create-account text-center">
                                    <p>
                                        <Link href="/login">← Giriş sayfasına dön</Link>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="inner-title text-center">
                                    <h2>Şifremi Unuttum</h2>
                                    <p style={{ color: "#666", marginTop: 8 }}>
                                        Hesabınıza kayıtlı e-posta adresini girin, size şifre
                                        sıfırlama bağlantısı gönderelim.
                                    </p>
                                </div>

                                {errorMessage && (
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
                                        {errorMessage}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="form-group">
                                                <div className="input-box">
                                                    <input
                                                        type="email"
                                                        placeholder="E-posta Adresi"
                                                        value={email}
                                                        onChange={(e) =>
                                                            setEmail(e.target.value)
                                                        }
                                                        required
                                                        autoComplete="email"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-12">
                                            <div className="form-group">
                                                <button
                                                    className="thm-btn"
                                                    type="submit"
                                                    disabled={forgotMutation.isPending}
                                                >
                                                    {forgotMutation.isPending
                                                        ? "Gönderiliyor..."
                                                        : "Sıfırlama Bağlantısı Gönder"}
                                                    <span className="icon-right-arrow"></span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="create-account text-center">
                                            <p>
                                                <Link href="/login">
                                                    ← Giriş sayfasına dön
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </AuthPageShell>
    );
}
