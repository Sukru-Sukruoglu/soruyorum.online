"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPortalAuthSession } from "@/utils/authSession";
import { Check, X, Sparkles, ShieldCheck, Zap, Crown } from "lucide-react";
import { useCart } from "@/utils/useCart";

type Plan = {
    key: "free" | "pro";
    name: string;
    price: string;
    priceNote: string;
    badge?: string;
    highlight?: boolean;
    ctaText: string;
    ctaHref: string;
    bullets: string[];
};

function FeatureRow({ label, free, pro }: { label: string; free: boolean | string; pro: boolean | string }) {
    const Cell = ({ v }: { v: boolean | string }) => {
        if (typeof v === "string") return <span className="text-white/80 text-sm">{v}</span>;
        return v ? <Check className="text-emerald-400" size={18} /> : <X className="text-white/25" size={18} />;
    };

    return (
        <div className="grid grid-cols-12 gap-4 items-center py-3 border-t border-white/10">
            <div className="col-span-12 md:col-span-6 text-white/85 text-sm">{label}</div>
            <div className="col-span-6 md:col-span-3 flex justify-start md:justify-center">
                <Cell v={free} />
            </div>
            <div className="col-span-6 md:col-span-3 flex justify-start md:justify-center">
                <Cell v={pro} />
            </div>
        </div>
    );
}

export default function PlansClient() {
    const { lineCount, total } = useCart();
    const proDisplayPrice = useMemo(() => process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "120 USD", []);
    const [proCtaHref, setProCtaHref] = useState<string>("/login");

    useEffect(() => {
        void fetchPortalAuthSession()
            .then((session) => {
                setProCtaHref(session.authenticated ? "/dashboard/billing" : "/login");
            })
            .catch(() => {
                setProCtaHref("/login");
            });
    }, []);

    const plans: Plan[] = [
        {
            key: "free",
            name: "EVENT PASS",
            price: "$0",
            priceNote: "Ücretsiz",
            ctaText: "Ücretsiz Başla",
            ctaHref: "/register",
            bullets: [
                "Temel soru-cevap deneyimi",
                "Canlı soru ekranı",
                "Temel moderasyon",
                "En fazla 5 mobil cihaz",
                "KVKK uyumlu kayıt akışı",
            ],
        },
        {
            key: "pro",
            name: "Pro",
            price: proDisplayPrice,
            priceNote: "Yıllık",
            badge: "Önerilen",
            highlight: true,
            ctaText: "Pro'ya Geç",
            ctaHref: proCtaHref,
            bullets: [
                "Tüm özellikler ve şablonlar",
                "Gelişmiş moderasyon araçları",
                "Daha fazla kontrol ve özelleştirme",
                "Öncelikli destek",
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white/95">
            {/* Top bar */}
            <nav className="sticky top-0 z-50 px-6 py-4 bg-black/85 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 font-extrabold text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        SoruYorum
                    </Link>
                    <div className="flex items-center gap-2">
                        {lineCount > 0 && (
                            <Link
                                href="/dashboard/billing"
                                className="hidden sm:inline-flex items-center gap-3 px-4 py-2 text-white border border-sky-400/25 bg-sky-500/10 rounded-xl text-sm font-semibold transition-all hover:bg-sky-500/15"
                            >
                                <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-extrabold">
                                    {lineCount}
                                </span>
                                <span>{total.toLocaleString("tr-TR")} TL</span>
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="hidden sm:block px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all"
                        >
                            Anasayfa
                        </Link>
                        <Link
                            href="/login"
                            className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all"
                        >
                            Giriş Yap
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
                        >
                            Ücretsiz Başla
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            {lineCount > 0 && (
                <div className="px-6 pt-6">
                    <div className="max-w-6xl mx-auto">
                        <Link
                            href="/dashboard/billing"
                            className="sm:hidden flex items-center justify-between gap-4 rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-white"
                        >
                            <span className="flex flex-col">
                                <span className="text-xs font-bold text-sky-200">Sepete Git</span>
                                <span className="text-sm font-semibold">{lineCount} urun • {total.toLocaleString("tr-TR")} TL</span>
                            </span>
                            <span className="text-lg font-black">→</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Hero */}
            <section className="pt-16 pb-10 px-6 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-52 -right-24 w-[600px] h-[600px] rounded-full bg-red-500/25 blur-[120px]" />
                    <div className="absolute -bottom-40 -left-24 w-[500px] h-[500px] rounded-full bg-rose-700/20 blur-[120px]" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            Basit fiyatlandırma, net planlar
                        </div>
                        <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            Planlar
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500"> </span>
                        </h1>
                        <p className="mt-4 text-white/60 text-lg">
                            Etkinlik ölçeğinize göre başlayın. İster ücretsiz kullanın, ister Pro ile tüm kilitli özellikleri açın.
                        </p>
                    </div>
                </div>
            </section>

            {/* Cards */}
            <section className="pb-14 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {plans.map((p) => (
                        <div
                            key={p.key}
                            className={
                                "rounded-3xl border p-8 relative overflow-hidden " +
                                (p.highlight
                                    ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-red-500/30"
                                    : "bg-white/[0.03] border-white/10")
                            }
                        >
                            {p.badge && (
                                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-bold">
                                    {p.badge}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div
                                    className={
                                        "w-11 h-11 rounded-2xl flex items-center justify-center " +
                                        (p.key === "pro" ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-white/10")
                                    }
                                >
                                    {p.key === "pro" ? <Crown className="text-white" size={20} /> : <Zap className="text-white" size={20} />}
                                </div>
                                <div>
                                    <div className="text-xl font-extrabold">{p.name}</div>
                                    <div className="text-white/60 text-sm">{p.priceNote}</div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-end gap-3">
                                <div className="text-4xl font-black tracking-tight">{p.price}</div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href={p.ctaHref}
                                    className={
                                        "block text-center w-full py-3.5 rounded-2xl font-bold transition-all " +
                                        (p.key === "pro"
                                            ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
                                            : "bg-white/10 hover:bg-white/15 text-white")
                                    }
                                >
                                    {p.ctaText}
                                </Link>
                                {p.key === "pro" && (
                                    <div className="text-xs text-white/50 mt-3">Ödemeyi hesabınıza giriş yaptıktan sonra başlatabilirsiniz.</div>
                                )}
                            </div>

                            <ul className="mt-7 space-y-3">
                                {p.bullets.map((b) => (
                                    <li key={b} className="flex items-start gap-3 text-white/80">
                                        <Check className="text-emerald-400 mt-0.5" size={18} />
                                        <span className="text-sm leading-relaxed">{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="absolute -inset-[100%] bg-white/5 blur-3xl pointer-events-none" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Comparison */}
            <section className="pb-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-2xl font-black">Özellik Karşılaştırması</h2>
                                <p className="text-white/55 mt-2 text-sm">İhtiyacınıza göre plan seçimi yapın.</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="grid grid-cols-12 gap-4 items-center pb-4">
                                <div className="col-span-12 md:col-span-6 text-white/50 text-xs font-bold uppercase tracking-wider">Özellik</div>
                                <div className="col-span-6 md:col-span-3 text-white/50 text-xs font-bold uppercase tracking-wider md:text-center">EVENT PASS</div>
                                <div className="col-span-6 md:col-span-3 text-white/50 text-xs font-bold uppercase tracking-wider md:text-center">Pro</div>
                            </div>

                            <FeatureRow label="Canlı Soru & Cevap" free={true} pro={true} />
                            <FeatureRow label="Anket / Quiz" free={false} pro={true} />
                            <FeatureRow label="Kelime Bulutu" free={false} pro={true} />
                            <FeatureRow label="Tombala / Çark" free={false} pro={true} />
                            <FeatureRow label="Gelişmiş Moderasyon" free={"Temel"} pro={"Gelişmiş"} />
                            <FeatureRow label="Destek" free={"E-posta"} pro={"Öncelikli"} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
