"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CreditCard, LayoutDashboard, Tags, Users } from "lucide-react";

const NAV_ITEMS = [
    { label: "Genel Bakis", href: "/yonetim/panel", icon: LayoutDashboard, exact: true },
    { label: "Kullanicilar", href: "/yonetim/kullanicilar", icon: Users },
    { label: "Odemeler", href: "/yonetim/odemeler", icon: CreditCard },
    { label: "Canli Izleme", href: "/yonetim/canli-izleme", icon: Activity },
    { label: "Fiyatlandirma", href: "/yonetim/fiyatlandirma", icon: Tags },
];

export function YonetimNav() {
    const pathname = usePathname();

    return (
        <div className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14">
                <nav className="flex gap-2 overflow-x-auto py-3">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "inline-flex min-w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
                                    isActive
                                        ? "border-red-400/40 bg-red-500/15 text-white shadow-lg shadow-red-950/20"
                                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
                                ].join(" ")}
                            >
                                <Icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}