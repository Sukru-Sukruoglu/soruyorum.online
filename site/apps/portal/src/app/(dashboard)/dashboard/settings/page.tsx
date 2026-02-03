"use client";

import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Palette, Globe, Save, Moon, Sun, Check } from "lucide-react";
import { trpc } from "@/utils/trpc";

type TabType = "profil" | "bildirimler" | "guvenlik" | "gorunum" | "dil";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("profil");

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <Settings className="text-red-500" />
                Ayarlar
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Navigation */}
                <div className="space-y-2">
                    <SettingsNavItem icon={User} label="Profil" active={activeTab === "profil"} onClick={() => setActiveTab("profil")} />
                    <SettingsNavItem icon={Bell} label="Bildirimler" active={activeTab === "bildirimler"} onClick={() => setActiveTab("bildirimler")} />
                    <SettingsNavItem icon={Shield} label="Güvenlik" active={activeTab === "guvenlik"} onClick={() => setActiveTab("guvenlik")} />
                    <SettingsNavItem icon={Palette} label="Görünüm" active={activeTab === "gorunum"} onClick={() => setActiveTab("gorunum")} />
                    <SettingsNavItem icon={Globe} label="Dil ve Bölge" active={activeTab === "dil"} onClick={() => setActiveTab("dil")} />
                </div>

                {/* Right: Content */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm transition-colors">
                    {activeTab === "profil" && <ProfilContent />}
                    {activeTab === "bildirimler" && <BildirimlerContent />}
                    {activeTab === "guvenlik" && <GuvenlikContent />}
                    {activeTab === "gorunum" && <GorunumContent />}
                    {activeTab === "dil" && <DilContent />}
                </div>
            </div>
        </div>
    );
}

function ProfilContent() {
    const meQuery = trpc.users.me.useQuery();
    const updateProfile = trpc.users.updateProfile.useMutation();
    const sendPhoneOtp = trpc.users.sendPhoneOtp.useMutation();
    const verifyPhoneOtp = trpc.users.verifyPhoneOtp.useMutation();

    const [didInit, setDidInit] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [organizationName, setOrganizationName] = useState("");
    const [timezone, setTimezone] = useState("Europe/Istanbul");
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [otpStatus, setOtpStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const getErrMessage = (e: any, fallback: string) => {
        const msg =
            e?.shape?.message ||
            e?.data?.message ||
            e?.message ||
            fallback;
        return typeof msg === "string" && msg.trim().length > 0 ? msg : fallback;
    };

    useEffect(() => {
        if (!meQuery.data || didInit) return;

        setFullName(meQuery.data.name ?? "");
        setEmail(meQuery.data.email ?? "");
        setPhone(meQuery.data.phone ?? "");
        setOrganizationName(meQuery.data.organizations?.name ?? meQuery.data.company ?? "");
        setTimezone(meQuery.data.timezone ?? "Europe/Istanbul");
        setDidInit(true);
    }, [meQuery.data, didInit]);

    const handleSave = async () => {
        setStatus(null);
        const previousPhone = (meQuery.data?.phone ?? "").trim();
        try {
            await updateProfile.mutateAsync({
                name: fullName.trim() || undefined,
                phone: phone.trim() || undefined,
                timezone: timezone.trim() || undefined,
                organizationName: organizationName.trim() || undefined,
            });
            setStatus({ type: "success", message: "Kaydedildi" });

            const refreshed = await meQuery.refetch();
            const currentPhone = (refreshed.data?.phone ?? "").trim();
            const isVerified = Boolean(refreshed.data?.phone_verified);

            if (currentPhone && !isVerified) {
                setOtpModalOpen(true);
                if (currentPhone !== previousPhone) {
                    await handleSendOtp();
                }
            }
        } catch (e: any) {
            setStatus({ type: "error", message: getErrMessage(e, "Kaydedilemedi") });
        }
    };

    const handleSendOtp = async () => {
        setOtpStatus(null);
        try {
            await sendPhoneOtp.mutateAsync({ phone: phone.trim() });
            setOtpStatus({ type: "success", message: "Doğrulama kodu gönderildi" });
        } catch (e: any) {
            setOtpStatus({ type: "error", message: getErrMessage(e, "Kod gönderilemedi") });
        }
    };

    const handleVerifyOtp = async () => {
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
        } catch (e: any) {
            setOtpStatus({ type: "error", message: getErrMessage(e, "Doğrulama başarısız") });
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profil Ayarları</h2>
            <div className="space-y-6">
                {meQuery.isLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Profil bilgileri yükleniyor…</div>
                )}
                {meQuery.isError && (
                    <div className="text-sm text-red-600">Profil bilgileri alınamadı</div>
                )}
                {status && (
                    <div
                        className={
                            status.type === "success"
                                ? "text-sm text-green-600"
                                : "text-sm text-red-600"
                        }
                    >
                        {status.message}
                    </div>
                )}
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Ad Soyad</label>
                    <input 
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">E-posta</label>
                    <input 
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 outline-none cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Telefon</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="örn. +90 5xx xxx xx xx"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Anlık promosyonlar ve bildirimler için telefon bilgilerinizi girin.
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
                            onClick={handleSendOtp}
                            disabled={sendPhoneOtp.isLoading || !phone.trim()}
                            className="px-3 py-2 text-sm border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                        >
                            Kod Gönder
                        </button>

                        {!meQuery.data?.phone_verified && phone.trim() && (
                            <button
                                type="button"
                                onClick={() => setOtpModalOpen(true)}
                                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Doğrula
                            </button>
                        )}
                    </div>

                    {!meQuery.data?.phone_verified && phone.trim() && (
                        <div className="mt-3 flex items-center gap-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="6 haneli kod"
                                className="w-40 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifyPhoneOtp.isLoading}
                                className="px-4 py-3 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                            >
                                Doğrula
                            </button>
                        </div>
                    )}

                    {otpStatus && (
                        <div className={otpStatus.type === "success" ? "text-xs text-green-600 mt-2" : "text-xs text-red-600 mt-2"}>
                            {otpStatus.message}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Şirket</label>
                    <input 
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Zaman Dilimi</label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    >
                        <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                        <option value="Europe/London">Europe/London (UTC+0)</option>
                        <option value="America/New_York">America/New_York (UTC-5)</option>
                    </select>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateProfile.isLoading || meQuery.isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                    <Save size={18} />
                    Değişiklikleri Kaydet
                </button>
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
                                    className="w-40 px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-red-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={verifyPhoneOtp.isLoading}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    Doğrula
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
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
        </>
    );
}

function BildirimlerContent() {
    const meQuery = trpc.users.me.useQuery(undefined, { retry: false });
    const updateNotifications = trpc.users.updateNotifications.useMutation();

    const [didInit, setDidInit] = useState(false);
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);
    const [smsNotif, setSmsNotif] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (!meQuery.data || didInit) return;
        setEmailNotif(Boolean(meQuery.data.email_notifications));
        setPushNotif(Boolean(meQuery.data.push_notifications));
        setSmsNotif(Boolean(meQuery.data.sms_notifications));
        setDidInit(true);
    }, [meQuery.data, didInit]);

    const hasPhone = Boolean(meQuery.data?.phone && String(meQuery.data.phone).trim().length > 0);
    const canEnableSms = hasPhone && Boolean(meQuery.data?.phone_verified);

    const handleSave = async () => {
        setStatus(null);
        try {
            await updateNotifications.mutateAsync({
                emailNotifications: emailNotif,
                pushNotifications: pushNotif,
                smsNotifications: smsNotif,
            });
            setStatus({ type: "success", message: "Kaydedildi" });
            await meQuery.refetch();
        } catch (e: any) {
            setStatus({ type: "error", message: e?.message || "Kaydedilemedi" });
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bildirim Ayarları</h2>
            <div className="space-y-6">
                {meQuery.isLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Bildirim ayarları yükleniyor…</div>
                )}
                {meQuery.isError && (
                    <div className="text-sm text-red-600">Bildirim ayarları alınamadı</div>
                )}
                {status && (
                    <div className={status.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
                        {status.message}
                    </div>
                )}
                <ToggleItem 
                    label="E-posta Bildirimleri" 
                    description="Yeni etkinlik ve güncellemeler hakkında e-posta alın"
                    checked={emailNotif}
                    onChange={setEmailNotif}
                />
                <ToggleItem 
                    label="Push Bildirimleri" 
                    description="Tarayıcı üzerinden anlık bildirimler alın"
                    checked={pushNotif}
                    onChange={setPushNotif}
                />
                <ToggleItem 
                    label="SMS Bildirimleri" 
                    description={
                        canEnableSms
                            ? "Önemli güncellemeler için SMS alın"
                            : hasPhone
                                ? "SMS için önce telefon numaranızı doğrulayın"
                                : "SMS için önce profilinize telefon numarası ekleyin"
                    }
                    checked={smsNotif}
                    onChange={(next) => {
                        if (!canEnableSms && next) return;
                        setSmsNotif(next);
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={updateNotifications.isLoading || meQuery.isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                    <Save size={18} />
                    Değişiklikleri Kaydet
                </button>
            </div>
        </>
    );
}

function GuvenlikContent() {
    const meQuery = trpc.users.me.useQuery(undefined, { retry: false });
    const changePassword = trpc.users.changePassword.useMutation();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordAgain, setNewPasswordAgain] = useState("");
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleUpdatePassword = async () => {
        setStatus(null);
        if (!currentPassword || !newPassword || !newPasswordAgain) {
            setStatus({ type: "error", message: "Lütfen tüm şifre alanlarını doldurun" });
            return;
        }
        if (newPassword !== newPasswordAgain) {
            setStatus({ type: "error", message: "Yeni şifreler eşleşmiyor" });
            return;
        }
        if (newPassword.length < 6) {
            setStatus({ type: "error", message: "Yeni şifre en az 6 karakter olmalı" });
            return;
        }

        try {
            await changePassword.mutateAsync({
                currentPassword,
                newPassword,
            });
            setStatus({ type: "success", message: "Şifre güncellendi" });
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordAgain("");
        } catch (e: any) {
            setStatus({ type: "error", message: e?.message || "Şifre güncellenemedi" });
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Güvenlik Ayarları</h2>
            <div className="space-y-6">
                {status && (
                    <div className={status.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
                        {status.message}
                    </div>
                )}
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Mevcut Şifre</label>
                    <input 
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Yeni Şifre</label>
                    <input 
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Yeni Şifre (Tekrar)</label>
                    <input 
                        type="password"
                        placeholder="••••••••"
                        value={newPasswordAgain}
                        onChange={(e) => setNewPasswordAgain(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">İki Faktörlü Doğrulama</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hesabınızı daha güvenli hale getirmek için iki faktörlü doğrulamayı etkinleştirin.</p>
                    <div className="flex items-center gap-3">
                        <button
                            disabled
                            title="2FA (Authenticator / TOTP) henüz login akışına entegre değil. İstersen bir sonraki adımda aktif hale getirelim."
                            className="px-4 py-2 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                            2FA (Yakında)
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Durum: {meQuery.data?.two_factor_enabled ? "Açık" : "Kapalı"}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleUpdatePassword}
                    disabled={changePassword.isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                    <Save size={18} />
                    Şifreyi Güncelle
                </button>
            </div>
        </>
    );
}

function GorunumContent() {
    const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
    const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
    const [saved, setSaved] = useState(false);

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('ks-theme') as "light" | "dark" | "system" | null;
        const savedFontSize = localStorage.getItem('ks-font-size') as "small" | "medium" | "large" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
        if (savedFontSize) setFontSize(savedFontSize);
    }, []);

    // Apply theme when changed
    const applyTheme = (newTheme: "light" | "dark" | "system") => {
        setTheme(newTheme);
        
        const root = document.documentElement;
        
        if (newTheme === "dark") {
            root.classList.add('dark');
            root.style.setProperty('--bg-primary', '#111827');
            root.style.setProperty('--bg-secondary', '#1f2937');
            root.style.setProperty('--text-primary', '#f9fafb');
            root.style.setProperty('--text-secondary', '#d1d5db');
        } else if (newTheme === "light") {
            root.classList.remove('dark');
            root.style.setProperty('--bg-primary', '#f9fafb');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--text-primary', '#111827');
            root.style.setProperty('--text-secondary', '#4b5563');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
        
        // Save immediately when theme is selected
        localStorage.setItem('ks-theme', newTheme);
    };

    const handleSave = () => {
        localStorage.setItem('ks-theme', theme);
        localStorage.setItem('ks-font-size', fontSize);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Görünüm Ayarları</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">Tema Seçimi</label>
                    <div className="grid grid-cols-3 gap-4">
                        <ThemeOption 
                            icon={Sun} 
                            label="Açık" 
                            selected={theme === "light"} 
                            onClick={() => applyTheme("light")} 
                        />
                        <ThemeOption 
                            icon={Moon} 
                            label="Koyu" 
                            selected={theme === "dark"} 
                            onClick={() => applyTheme("dark")} 
                        />
                        <ThemeOption 
                            icon={Settings} 
                            label="Sistem" 
                            selected={theme === "system"} 
                            onClick={() => applyTheme("system")} 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Yazı Tipi Boyutu</label>
                    <select 
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value as "small" | "medium" | "large")}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    >
                        <option value="small">Küçük</option>
                        <option value="medium">Orta</option>
                        <option value="large">Büyük</option>
                    </select>
                </div>
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/20"
                >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {saved ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
                </button>
            </div>
        </>
    );
}

function DilContent() {
    return (
        <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Dil ve Bölge Ayarları</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Dil</label>
                    <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none">
                        <option value="tr">🇹🇷 Türkçe</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="fr">🇫🇷 Français</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Bölge</label>
                    <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none">
                        <option value="TR">Türkiye</option>
                        <option value="US">Amerika Birleşik Devletleri</option>
                        <option value="GB">Birleşik Krallık</option>
                        <option value="DE">Almanya</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Tarih Formatı</label>
                    <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none">
                        <option value="dd/mm/yyyy">GG/AA/YYYY (19/01/2026)</option>
                        <option value="mm/dd/yyyy">AA/GG/YYYY (01/19/2026)</option>
                        <option value="yyyy-mm-dd">YYYY-AA-GG (2026-01-19)</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-red-500/20">
                    <Save size={18} />
                    Değişiklikleri Kaydet
                </button>
            </div>
        </>
    );
}

function ToggleItem({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (val: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-500'}`}
            >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function ThemeOption({ icon: Icon, label, selected, onClick }: { icon: React.ElementType; label: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selected 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-300'
            }`}
        >
            <Icon size={24} />
            <span className="text-sm font-medium">{label}</span>
            {selected && <Check size={16} className="text-red-500" />}
        </button>
    );
}

function SettingsNavItem({ icon: Icon, label, active = false, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                active 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
            <Icon size={20} />
            {label}
        </button>
    );
}
