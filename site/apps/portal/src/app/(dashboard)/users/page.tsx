"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield } from "lucide-react";
import { trpc } from "../../../utils/trpc";
import { getRoleFromToken } from "../../../utils/auth";

function formatDate(value: string | Date) {
    try {
        const d = typeof value === "string" ? new Date(value) : value;
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(d);
    } catch {
        return "-";
    }
}

export default function UsersPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            const r = getRoleFromToken(token);
            setRole(r);
            if (r !== "superadmin") {
                router.replace("/dashboard");
            }
        } catch {
            setRole(null);
            router.replace("/login");
        }
    }, [router]);

    const { data, isLoading, error } = trpc.users.list.useQuery(undefined, {
        enabled: role === "superadmin",
        retry: false,
    });

    const filtered = useMemo(() => {
        const users = data ?? [];
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const orgName = u.organizations?.name ?? "";
            return (
                (u.email ?? "").toLowerCase().includes(q) ||
                (u.name ?? "").toLowerCase().includes(q) ||
                (u.role ?? "").toLowerCase().includes(q) ||
                orgName.toLowerCase().includes(q)
            );
        });
    }, [data, query]);

    return (
        <div className="p-10">
            <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-gray-900">Kullanıcılar</h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            <Shield size={14} />
                            Sadece Süper Admin
                        </span>
                    </div>
                    <p className="text-gray-500 mt-2">
                        Sisteme kayıt olan kullanıcıları görüntüleyin.
                    </p>
                </div>

                <div className="w-full max-w-md">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ara: e-posta, isim, rol, organizasyon..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Toplam: <span className="font-semibold text-gray-900">{filtered.length}</span>
                    </div>
                    {isLoading ? (
                        <div className="text-sm text-gray-500">Yükleniyor...</div>
                    ) : null}
                </div>

                {error ? (
                    <div className="p-6 text-sm text-red-600">
                        Kullanıcılar yüklenemedi: {error.message}
                    </div>
                ) : null}

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-bold text-gray-600">
                                <th className="px-6 py-3">İsim</th>
                                <th className="px-6 py-3">E-posta</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3">Organizasyon</th>
                                <th className="px-6 py-3">Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(filtered ?? []).map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        {u.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {u.organizations?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {formatDate(u.created_at as unknown as string)}
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filtered.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-gray-500" colSpan={5}>
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
