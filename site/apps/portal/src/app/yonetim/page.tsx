"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { isSuperAdminRole } from "@/utils/auth";
import {
    clearLegacyAuthStorage,
    fetchPortalAuthSession,
    logoutPortalSession,
    storeLegacyUserName,
} from "@/utils/authSession";

export default function YonetimEntryPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasSuperAdminSession, setHasSuperAdminSession] = useState(false);
    const [sessionName, setSessionName] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        void fetchPortalAuthSession()
            .then((session) => {
                if (!mounted) return;
                setHasSuperAdminSession(session.authenticated && isSuperAdminRole(session.role));
                setSessionName(session.user.name ?? null);
            })
            .catch(() => {
                if (!mounted) return;
                setHasSuperAdminSession(false);
                setSessionName(null);
            })
            .finally(() => {
                if (mounted) setIsCheckingSession(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

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
                setErrorMessage(data?.error || "Giris sirasinda bir hata olustu.");
                return;
            }

            clearLegacyAuthStorage();
            storeLegacyUserName(data?.user?.name ?? null);

            const session = await fetchPortalAuthSession();
            if (!session.authenticated || !isSuperAdminRole(session.role)) {
                await logoutPortalSession();
                setErrorMessage("Bu alan yalnizca super admin kullanicilar icindir.");
                return;
            }

            router.replace("/yonetim/panel");
        } catch {
            setErrorMessage("Giris sirasinda bir hata olustu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid min-h-[calc(100vh-4rem)] gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <section className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <ShieldCheck size={14} />
                    Ayri Yonetim Girisi
                </div>

                <div className="space-y-4">
                    <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Dashboard degil, dogrudan yonetim giris ekrani.
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        Bu sayfa super admin operasyonlari icin ayrildi. Buradan giris yaptiginizda normal kullanici dashboard'una degil, dogrudan yonetim paneline gecersiniz.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 text-red-200">
                            <LockKeyhole size={20} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-white">Guvenli Erisim</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Kullanicilar, odemeler, canli izleme ve fiyatlandirma ekranlari ayrik yonetim akisi icinde tutulur.
                        </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-white">Ayrik Deneyim</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            `/yonetim` artik landing ve giris sayfasi olarak calisir. Yonetim paneli kendi ic yapisinda ilerler.
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                {isCheckingSession ? (
                    <div className="space-y-3">
                        <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
                        <div className="h-10 w-full animate-pulse rounded-2xl bg-white/10" />
                        <div className="h-10 w-full animate-pulse rounded-2xl bg-white/10" />
                        <div className="h-12 w-full animate-pulse rounded-2xl bg-white/10" />
                    </div>
                ) : hasSuperAdminSession ? (
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-emerald-300">Aktif super admin oturumu bulundu</p>
                            <h2 className="mt-2 text-2xl font-black text-white">
                                {sessionName?.trim() ? `${sessionName} olarak devam edin` : "Panele devam edin"}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                Ayrik yonetim paneline dogrudan gecebilirsiniz. Normal dashboard akisi kullanilmayacak.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/yonetim/panel"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:from-red-500 hover:to-red-600"
                            >
                                Yonetim paneline gir
                                <ArrowRight size={16} />
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    void logoutPortalSession().finally(() => {
                                        setHasSuperAdminSession(false);
                                        setSessionName(null);
                                    });
                                }}
                                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                            >
                                Bu oturumu kapat
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-red-200">Super admin girisi</p>
                            <h2 className="mt-2 text-2xl font-black text-white">Yonetim hesabinizla giris yapin</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                Bu form yalnizca yonetim paneli icin kullanilir. Basarili giristen sonra `/yonetim/panel` alanina yonlendirilirsiniz.
                            </p>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {errorMessage && (
                                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">E-posta</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-red-400/50 focus:bg-white/10"
                                    placeholder="yonetim@soruyorum.online"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Sifre</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-red-400/50 focus:bg-white/10"
                                    placeholder="Sifrenizi girin"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? "Giris yapiliyor..." : "Yonetim paneline gir"}
                                <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                )}
            </section>
        </div>
    );
}