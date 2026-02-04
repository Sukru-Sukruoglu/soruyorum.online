"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, BarChart2, FileText, Settings, Briefcase, Crown, LogOut, Users } from "lucide-react";
import { getRoleFromToken, isSuperAdminRole } from "../../utils/auth";
import { PremiumUpgradePanel } from "../billing/PremiumUpgradePanel";

const NAV_ITEMS = [
    { label: "Etkinliklerim", icon: LayoutDashboard, href: "/dashboard", activeColor: "from-red-600 to-red-700", exact: true },
    { label: "İstatistikler", icon: BarChart2, href: "/dashboard/stats", activeColor: "from-blue-600 to-blue-700", exact: false },
    { label: "Raporlar", icon: FileText, href: "/dashboard/reports", activeColor: "from-green-600 to-green-700", exact: false },
    { label: "Çalışma Alanım", icon: Briefcase, href: "/dashboard/workspace", activeColor: "from-purple-600 to-purple-700", exact: false },
    { label: "Ayarlar", icon: Settings, href: "/dashboard/settings", activeColor: "from-gray-600 to-gray-700", exact: false },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null | undefined>(undefined);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            setRole(getRoleFromToken(token));
        } catch {
            setRole(null);
        }
    }, []);

    const roleResolved = role !== undefined;
    const shouldShowUpgrade = roleResolved && !isSuperAdminRole(role);

    const navItems = useMemo(() => {
        if (!isSuperAdminRole(role)) return NAV_ITEMS;
        return [
            ...NAV_ITEMS.slice(0, 4),
            {
                label: "Kullanıcılar",
                icon: Users,
                href: "/dashboard/users",
                activeColor: "from-purple-600 to-indigo-700",
                exact: false,
            },
            ...NAV_ITEMS.slice(4),
        ];
    }, [role]);

    const handleLogout = () => {
        try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
        } catch {
            // ignore
        }
        router.push('/login');
    };

    useEffect(() => {
        if (!upgradeOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setUpgradeOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [upgradeOpen]);

    return (
        <aside className="w-[280px] h-screen fixed left-0 top-0 bg-gradient-to-b from-black to-neutral-900 border-r border-brand-primary/20 flex flex-col z-40">
            {/* Logo Section */}
            <div className="p-8 border-b border-white/5">
                <div className="w-56 h-24 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/beyazlogouzun.png" alt="KS İnteraktif Logo" className="w-full h-full object-contain" />
                </div>
                <div className="h-0.5 w-full bg-brand-primary/50 mt-4 rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = item.exact 
                        ? pathname === item.href 
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group relative overflow-hidden
                                ${isActive
                                    ? `bg-gradient-to-r ${item.activeColor} text-white shadow-lg shadow-brand-primary/20`
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }
                            `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50" />
                            )}
                            <Icon size={20} className={`transition-transform duration-200 ${!isActive && "group-hover:scale-110"}`} />
                            <span className="font-semibold tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={handleLogout}
                    className={
                        "w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group relative overflow-hidden " +
                        "text-red-300 hover:text-white hover:bg-red-600/20"
                    }
                >
                    <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-semibold tracking-wide">Çıkış</span>
                </button>
            </nav>

            {/* Upgrade Card (Sticky Bottom) */}
            {shouldShowUpgrade && (
                <div className="p-4 mt-auto">
                    <div className="bg-gradient-to-br from-black to-brand-dark border border-brand-primary/30 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Crown size={80} />
                        </div>

                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                                <Crown size={20} className="text-white" />
                            </div>
                            <h3 className="text-white font-bold">Premium'a Geç</h3>
                        </div>

                        <p className="text-gray-400 text-xs mb-4 relative z-10 leading-relaxed">
                            Tüm özelliklerin ve şablonların kilidini açın.
                        </p>

                        <button
                            type="button"
                            onClick={() => setUpgradeOpen(true)}
                            className="block text-center w-full py-2.5 bg-white text-brand-primary font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg relative z-10"
                        >
                            Yükselt
                        </button>

                        {/* Hover Glow */}
                        <div className="absolute -inset-[100%] bg-white/5 blur-3xl group-hover:inset-0 transition-all duration-700" />
                    </div>
                </div>
            )}

            {shouldShowUpgrade && upgradeOpen && (
                <div
                    className="fixed inset-0 z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Premium'a Geç"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setUpgradeOpen(false)}
                        aria-label="Kapat"
                    />

                    <div className="absolute inset-0 p-4 sm:p-8 overflow-y-auto">
                        <div className="mx-auto max-w-5xl rounded-2xl bg-[#F8F8F8] border border-white/10 shadow-2xl">
                            <div className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="text-gray-900 font-black text-lg">Premium'a Geç</div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/dashboard/billing"
                                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                                        onClick={() => setUpgradeOpen(false)}
                                    >
                                        Sayfada aç
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setUpgradeOpen(false)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 pt-0">
                                <PremiumUpgradePanel showHeader={false} showRefresh={true} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
