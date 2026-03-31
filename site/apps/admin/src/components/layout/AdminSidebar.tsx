"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Building2,
    Activity,
    CreditCard,
    LayoutDashboard,
    LogOut
} from "lucide-react";
import { Logo } from "@ks-interaktif/ui";

export function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: "Genel Bakış", href: "/dashboard" },
        { icon: Users, label: "Kullanıcılar", href: "/users" },
        { icon: Building2, label: "Organizasyonlar", href: "/organizations" },
        { icon: Activity, label: "Sistem Sağlığı", href: "/health" },
        { icon: CreditCard, label: "Abonelikler", href: "/subscriptions" },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-40">
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Logo variant="dark" size="sm" animate={false} />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium">Süper Admin</p>
                        <p className="text-xs text-slate-500">admin@ks.com</p>
                    </div>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                    <LogOut size={18} />
                    Çıkış Yap
                </button>
            </div>
        </aside>
    );
}
