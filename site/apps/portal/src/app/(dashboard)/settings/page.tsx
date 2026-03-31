"use client";

import { Button } from "@ks-interaktif/ui";
import { User, Bell, Lock, CreditCard, Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/utils/trpc";
import { isSuperAdminRole } from "@/utils/auth";

export default function SettingsPage() {
    const meQuery = trpc.users.me.useQuery();
    const updateProfile = trpc.users.updateProfile.useMutation();
    const sendPhoneOtp = trpc.users.sendPhoneOtp.useMutation();
    const verifyPhoneOtp = trpc.users.verifyPhoneOtp.useMutation();

    const [didInit, setDidInit] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [title, setTitle] = useState("");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpStatus, setOtpStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const initials = useMemo(() => {
        const safe = `${firstName} ${lastName}`.trim();
        if (!safe) return "";
        const parts = safe.split(/\s+/).filter(Boolean);
        return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
    }, [firstName, lastName]);

    useEffect(() => {
        if (!meQuery.data || didInit) return;
        const fullName = (meQuery.data.name ?? "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
        setEmail(meQuery.data.email ?? "");
        setPhone(meQuery.data.phone ?? "");
        const role = meQuery.data.role;
        setTitle(isSuperAdminRole(role) ? "Süper Admin" : role === "admin" ? "Admin" : role === "junioradmin" ? "Junior Admin" : role);
        setDidInit(true);
    }, [meQuery.data, didInit]);

    const getErrMessage = (e: any, fallback: string) => {
        const msg =
            e?.shape?.message ||
            e?.data?.message ||
            e?.message ||
            fallback;
        return typeof msg === "string" && msg.trim().length > 0 ? msg : fallback;
    };

    const doSendOtp = async () => {
        setOtpStatus(null);
        try {
            await sendPhoneOtp.mutateAsync({ phone: phone.trim() });
            setOtpStatus({ type: "success", message: "Doğrulama kodu gönderildi" });
        } catch (e: any) {
            setOtpStatus({ type: "error", message: getErrMessage(e, "Kod gönderilemedi") });
        }
    };

    const doVerifyOtp = async () => {
        setOtpStatus(null);
        const code = otpCode.trim();
        if (!/^\d{6}$/.test(code)) {
            setOtpStatus({ type: "error", message: "6 haneli kod girin" });
            return;
        }
        try {
            await verifyPhoneOtp.mutateAsync({ code });
            setOtpCode("");
            setOtpStatus({ type: "success", message: "Telefon doğrulandı" });
            await meQuery.refetch();
            setOtpModalOpen(false);
        } catch (e: any) {
            setOtpStatus({ type: "error", message: getErrMessage(e, "Doğrulama başarısız") });
        }
    };

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const previousPhone = (meQuery.data?.phone ?? "").trim();
        const fullName = `${firstName} ${lastName}`.trim();
        await updateProfile.mutateAsync({ name: fullName || undefined, phone: phone.trim() || undefined });
        const refreshed = await meQuery.refetch();

        const currentPhone = (refreshed.data?.phone ?? "").trim();
        const isVerified = Boolean(refreshed.data?.phone_verified);

        if (currentPhone && !isVerified) {
            setOtpModalOpen(true);
            if (currentPhone !== previousPhone) {
                await doSendOtp();
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 min-h-[600px]">
                    {/* Sidebar */}
                    <div className="bg-gray-50 p-6 border-r border-gray-200 space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-600 font-medium text-sm">
                            <User size={18} /> Profil
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                            <Lock size={18} /> Güvenlik
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                            <Bell size={18} /> Bildirimler
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                            <CreditCard size={18} /> Faturalandırma
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
                            <Globe size={18} /> Dil ve Bölge
                        </button>
                    </div>

                    {/* Content */}
                    <div className="col-span-3 p-8">
                        <h2 className="text-xl font-bold mb-6">Profil Bilgileri</h2>

                        {meQuery.isLoading && (
                            <div className="text-sm text-gray-500 mb-4">Profil bilgileri yükleniyor…</div>
                        )}
                        {meQuery.isError && (
                            <div className="text-sm text-red-600 mb-4">Profil bilgileri alınamadı</div>
                        )}

                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white shadow-lg">
                                {initials || ""}
                            </div>
                            <div>
                                <Button className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 h-9 px-3 text-sm">Fotoğrafı Değiştir</Button>
                                <p className="text-xs text-gray-400 mt-2">JPG, GIF veya PNG. Max 5MB.</p>
                            </div>
                        </div>

                        <form className="space-y-6 max-w-lg" onSubmit={onSave}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50"
                                    value={email}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="örn. 05xx xxx xx xx"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Anlık promosyonlar ve bildirimler için telefon bilginizi girebilirsiniz.
                                </p>

                                <div className="mt-3 flex items-center gap-3">
                                    <span
                                        className={
                                            meQuery.data?.phone_verified
                                                ? "text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md"
                                                : "text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md"
                                        }
                                    >
                                        {meQuery.data?.phone_verified ? "Doğrulandı" : "Doğrulanmadı"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpModalOpen(true);
                                            void doSendOtp();
                                        }}
                                        disabled={sendPhoneOtp.isLoading || !phone.trim()}
                                        className="px-3 py-2 text-sm border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60"
                                    >
                                        Kod Gönder
                                    </button>
                                </div>

                                {otpStatus && (
                                    <div
                                        className={
                                            otpStatus.type === "success"
                                                ? "mt-2 text-xs text-green-600"
                                                : "mt-2 text-xs text-red-600"
                                        }
                                    >
                                        {otpStatus.message}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unvan</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50"
                                    value={title}
                                    readOnly
                                />
                            </div>

                            <div className="pt-4">
                                <Button className="bg-indigo-600 text-white" disabled={updateProfile.isLoading || meQuery.isLoading}>
                                    Değişiklikleri Kaydet
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {otpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Telefon Doğrulama</div>
                                <div className="text-xs text-gray-500 mt-1">6 haneli kodu girerek doğrulayın</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setOtpModalOpen(false);
                                    setOtpStatus(null);
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Kapat
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="text-xs text-gray-500">
                                Telefon: <span className="font-medium text-gray-800">{phone.trim() || "-"}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d{6}"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="6 haneli kod"
                                    className="w-40 px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={doVerifyOtp}
                                    disabled={verifyPhoneOtp.isLoading}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    Doğrula
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={doSendOtp}
                                    disabled={sendPhoneOtp.isLoading || !phone.trim()}
                                    className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Tekrar Kod Gönder
                                </button>
                            </div>

                            {otpStatus && (
                                <div className={otpStatus.type === "success" ? "text-xs text-green-600" : "text-xs text-red-600"}>
                                    {otpStatus.message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
