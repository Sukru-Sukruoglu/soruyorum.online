"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, BarChart2, FileText, Settings, Briefcase, LogOut, Users, Crown, CreditCard } from "lucide-react";
import { isSuperAdminRole } from "../../utils/auth";
import { fetchPortalAuthSession, logoutPortalSession } from "../../utils/authSession";
import { UpgradeContactModal } from "../upgrade/UpgradeContactModal";
import { Logo } from "@ks-interaktif/ui";

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
    const [contactOpen, setContactOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (mounted) setRole(session.role);
            })
            .catch(() => {
                if (mounted) setRole(null);
            });
        return () => {
            mounted = false;
        };
    }, []);

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
            {
                label: "Billing Ops",
                icon: CreditCard,
                href: "/dashboard/billing-ops",
                activeColor: "from-amber-600 to-orange-700",
                exact: false,
            },
            ...NAV_ITEMS.slice(4),
        ];
    }, [role]);

    const handleLogout = () => {
        void logoutPortalSession().finally(() => {
            window.location.href = '/';
        });
    };

    return (
        <aside className="w-[280px] h-screen fixed left-0 top-0 bg-gradient-to-b from-black to-neutral-900 border-r border-brand-primary/20 flex flex-col z-40">
            {/* Logo Section */}
            <div className="p-8 border-b border-white/5">
                <div className="flex justify-center">
                    <Logo variant="dark" size="sm" />
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

            {/* Premium Card (kept, opens contact info) */}
            <div className="p-4">
                <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 to-neutral-950/40 p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow">
                            <Crown className="text-white" size={18} />
                        </div>
                        <div>
                            <div className="text-white font-extrabold leading-tight">Premium'a Geç</div>
                            <div className="text-xs text-gray-300">Tüm özelliklerin ve şablonların kilidini açın.</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setContactOpen(true)}
                        className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold py-3 transition-colors"
                    >
                        Yükselt
                    </button>
                </div>
            </div>

            <UpgradeContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

        </aside>
    );
}
