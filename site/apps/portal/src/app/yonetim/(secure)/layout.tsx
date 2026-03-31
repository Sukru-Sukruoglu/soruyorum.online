import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { getAuthCookieName } from "@/app/api/_lib/authCookie";
import { YonetimNav } from "@/components/layout/YonetimNav";
import { getRoleFromToken, isSuperAdminRole } from "@/utils/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const API_URL = process.env.API_URL || "http://localhost:4000";

async function getSessionRole(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieName())?.value?.trim();
        if (!token) return null;

        const fallbackRole = getRoleFromToken(token);

        const upstream = await fetch(`${API_URL}/api/settings`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        }).catch(() => null);

        if (!upstream?.ok) return fallbackRole;

        const data = await upstream.json().catch(() => null);
        if (data && typeof data.role === "string" && data.role.trim()) {
            return data.role.trim();
        }

        return fallbackRole;
    } catch {
        return null;
    }
}

interface SecureYonetimLayoutProps {
    children: React.ReactNode;
}

export default async function SecureYonetimLayout({
    children,
}: SecureYonetimLayoutProps) {
    const role = await getSessionRole();

    if (!isSuperAdminRole(role)) {
        redirect("/yonetim");
    }

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14">
                    <div className="flex min-h-16 items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-950/40">
                                <LayoutDashboard size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Yonetim</h1>
                                <p className="text-xs text-slate-400">soruyorum.online super admin paneli</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200 sm:inline-flex">
                                <ShieldCheck size={14} />
                                Super Admin
                            </div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-white"
                            >
                                Portale don
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <YonetimNav />

            <main className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
                {children}
            </main>
        </>
    );
}