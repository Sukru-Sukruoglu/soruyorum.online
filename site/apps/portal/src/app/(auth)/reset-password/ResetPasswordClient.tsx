"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../../utils/trpc";

export default function ResetPasswordClient({ token }: { token: string }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resetMutation = trpc.auth.resetPassword.useMutation({
        onSuccess: () => {
            setSuccess(true);
            setErrorMessage(null);
        },
        onError: (err) => {
            setErrorMessage(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (password.length < 6) {
            setErrorMessage("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Şifreler eşleşmiyor.");
            return;
        }

        resetMutation.mutate({ token, password });
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Bağlantı</h2>
                    <p className="text-gray-500 mb-6">Şifre sıfırlama bağlantısı geçersiz veya eksik.</p>
                    <Link href="/forgot-password" className="text-red-600 font-semibold hover:text-red-700">
                        Yeni sıfırlama bağlantısı iste →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/40 via-black to-black z-0"></div>
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
                            Yeni Şifre<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Belirleyin.</span>
                        </h1>
                    </div>

                    <div className="relative text-sm text-gray-500 font-medium tracking-wide">
                        © 2026 Soru-Yorum. Tüm hakları Keypad Sistem İletişim Bilişim Turz. Tic. Ltd. Şti. tarafından saklıdır.
                    </div>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    {success ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Şifreniz güncellendi</h2>
                                <p className="text-gray-500 mt-2">Yeni şifrenizle giriş yapabilirsiniz.</p>
                            </div>
                            <div className="text-center mt-6">
                                <Link
                                    href="/login"
                                    className="inline-block w-full h-12 leading-[3rem] text-center text-base bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg shadow-red-200 transition-all"
                                >
                                    Giriş Yap →
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Yeni Şifre Belirle</h2>
                                <p className="text-gray-500 mt-2">Hesabınız için yeni bir şifre oluşturun.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                                    <input
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Şifre Tekrar</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-gray-900 bg-white"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={resetMutation.isPending}
                                    className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg shadow-red-200 disabled:opacity-50 transition-all"
                                >
                                    {resetMutation.isPending ? "Şifre güncelleniyor..." : "Şifremi Güncelle"}
                                </button>
                            </form>

                            <div className="mt-8 text-center text-gray-500 text-sm">
                                <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">
                                    ← Giriş sayfasına dön
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
