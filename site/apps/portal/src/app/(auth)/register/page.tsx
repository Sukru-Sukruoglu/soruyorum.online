"use client";

import Link from "next/link";
import { Button } from "@ks-interaktif/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../utils/trpc";

export default function RegisterPage() {
    const router = useRouter();
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [explicitConsentAccepted, setExplicitConsentAccepted] = useState(false);

    const registerMutation = trpc.auth.registerAdmin.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("auth_token", data.token);
            window.location.href = "/dashboard";
        },
        onError: (error) => {
            alert(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!kvkkAccepted || !explicitConsentAccepted) {
            alert("Devam etmek için KVKK ve Açık Rıza metinlerini onaylamanız gerekir.");
            return;
        }

        const formData = new FormData(e.target as HTMLFormElement);
        const name = `${formData.get("firstName")} ${formData.get("lastName")}`;
        const organizationName = formData.get("organizationName") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const phoneRaw = (formData.get("phone") as string | null) ?? "";
        const phone = phoneRaw.trim();

        registerMutation.mutate({
            name,
            organizationName,
            email,
            password,
            phone: phone ? phone : undefined,
            kvkkAccepted: true,
            explicitConsentAccepted: true,
            consentVersion: "v1",
        });
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-black relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black z-0"></div>

                {/* Animated Blobs */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-red-600/30 rounded-full blur-[100px] animate-blob z-0"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[100px] animate-blob animation-delay-2000 z-0"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000 z-0"></div>

                <div className="p-12 relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="w-24 h-24 relative mb-8 animate-float">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/logo.png" alt="KS İnteraktif Logo" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <h1 className="text-6xl font-black mb-8 leading-tight tracking-tight">
                            Yeni Nesil<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Etkinlik Deneyimi.</span>
                        </h1>
                        <p className="text-gray-400 text-xl max-w-lg leading-relaxed font-light">
                            14 günlük ücretsiz deneme ile hemen başlayın. Kredi kartı gerekmez.
                        </p>
                    </div>

                    <div className="relative text-sm text-gray-500 font-medium tracking-wide">
                        © 2026 KS İnteraktif.
                    </div>
                </div>
            </div>

            {/* Right: Register Form */}
            <div className="flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Kayıt Ol</h2>
                        <p className="text-gray-500 mt-2">Hızlıca organizasyonunuzu oluşturun</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                                <input name="firstName" type="text" autoComplete="given-name" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                                <input name="lastName" type="text" autoComplete="family-name" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kurum Adı</label>
                            <input name="organizationName" type="text" autoComplete="organization" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white" placeholder="Şirket veya Organizasyon" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
                            <input name="email" type="email" autoComplete="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon (Opsiyonel)</label>
                            <input
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white"
                                placeholder="örn. +90 5xx xxx xx xx"
                            />
                            <p className="text-xs text-gray-400 mt-2">Anlık promosyonlar ve bildirimler için telefon bilginizi girebilirsiniz.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                            <input name="password" type="password" autoComplete="new-password" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white" required />
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    checked={kvkkAccepted}
                                    onChange={(e) => setKvkkAccepted(e.target.checked)}
                                    required
                                />
                                <span>
                                    <Link href="/kvkk" className="text-red-600 font-semibold hover:text-red-700">KVKK Aydınlatma Metni</Link>
                                    {"'"}ni okudum ve anladım.
                                </span>
                            </label>
                            <label className="flex items-start gap-3 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    checked={explicitConsentAccepted}
                                    onChange={(e) => setExplicitConsentAccepted(e.target.checked)}
                                    required
                                />
                                <span>
                                    <Link href="/acik-riza" className="text-red-600 font-semibold hover:text-red-700">Açık Rıza Metni</Link>
                                    {"'"}ni okudum ve onaylıyorum.
                                </span>
                            </label>
                        </div>

                        <Button
                            className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                            disabled={registerMutation.isPending || !kvkkAccepted || !explicitConsentAccepted}
                        >
                            {registerMutation.isPending ? "Kayıt Olunuyor..." : "Hesap Oluştur"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Zaten hesabınız var mı?
                        <Link href="/login" className="text-red-600 font-semibold hover:text-red-700 ml-1">
                            Giriş Yap
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
