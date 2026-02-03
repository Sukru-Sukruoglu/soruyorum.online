"use client";

import Link from "next/link";
import { Button } from "@ks-interaktif/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../utils/trpc";

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("auth_token", data.token);
            window.location.href = "/dashboard"; // Force reload to apply headers
        },
        onError: (error) => {
            alert(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        loginMutation.mutate({ email, password });
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
                            <img src="/images/logo.png" alt="Keypad Sistem Logo" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <h1 className="text-6xl font-black mb-8 leading-tight tracking-tight">
                            Etkinliklerinizi<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Yönetin.</span>
                        </h1>
                        <p className="text-gray-400 text-xl max-w-lg leading-relaxed font-light">
                            Tek bir panelden tüm interaktif sunumlarınızı, yarışmalarınızı ve raporlarınızı kontrol edin.
                        </p>
                    </div>

                    <div className="relative text-sm text-gray-500 font-medium tracking-wide">
                        © 2026 KS İnteraktif.
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Giriş Yap</h2>
                        <p className="text-gray-500 mt-2">Hesabınıza erişmek için bilgilerinizi girin</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
                            <input
                                name="email"
                                type="email"
                                autoComplete="username"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white"
                                placeholder="ornek@sirket.com"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Şifre</label>
                                <a href="#" className="text-sm text-red-600 hover:text-red-700 font-medium">Şifremi unuttum?</a>
                            </div>
                            <input
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Hesabınız yok mu?
                        <Link href="/register" className="text-red-600 font-semibold hover:text-red-700 ml-1">
                            Hemen Kayıt Olun
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
