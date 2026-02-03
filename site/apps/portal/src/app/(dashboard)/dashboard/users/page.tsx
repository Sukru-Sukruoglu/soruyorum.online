"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, Trash2, Phone, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "../../../../utils/trpc";
import { getRoleFromToken } from "../../../../utils/auth";

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
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

    const utils = trpc.useUtils();
    const { data, isLoading, error } = trpc.users.list.useQuery(undefined, {
        enabled: role === "superadmin",
        retry: false,
    });

    const deleteMutation = trpc.users.delete.useMutation({
        onSuccess: () => {
            utils.users.list.invalidate();
            setDeleteConfirm(null);
        },
    });

    const handleDelete = (userId: string) => {
        deleteMutation.mutate({ userId });
    };

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
                (u.phone ?? "").toLowerCase().includes(q) ||
                (u.company ?? "").toLowerCase().includes(q) ||
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
                    <p className="text-gray-500 mt-2">Sisteme kayıt olan kullanıcıları görüntüleyin ve yönetin.</p>
                </div>

                <div className="w-full max-w-md">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ara: e-posta, isim, rol, telefon, organizasyon..."
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
                    {isLoading ? <div className="text-sm text-gray-500">Yükleniyor...</div> : null}
                </div>

                {error ? (
                    <div className="p-6 text-sm text-red-600">Kullanıcılar yüklenemedi: {error.message}</div>
                ) : null}

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-bold text-gray-600">
                                <th className="px-6 py-3">İsim</th>
                                <th className="px-6 py-3">E-posta</th>
                                <th className="px-6 py-3">Telefon</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3">Şirket</th>
                                <th className="px-6 py-3">Organizasyon</th>
                                <th className="px-6 py-3">Kayıt Tarihi</th>
                                <th className="px-6 py-3 text-center">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(filtered ?? []).map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{u.name || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {u.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span>{u.phone}</span>
                                                {u.phone_verified ? (
                                                    <CheckCircle size={14} className="text-green-500" title="Doğrulanmış" />
                                                ) : (
                                                    <XCircle size={14} className="text-red-400" title="Doğrulanmamış" />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            u.role === "superadmin" 
                                                ? "bg-purple-100 text-purple-700" 
                                                : "bg-gray-100 text-gray-700"
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{u.company || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{u.organizations?.name || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {formatDate(u.created_at as unknown as string)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {deleteConfirm === u.id ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {deleteMutation.isPending ? "Siliniyor..." : "Onayla"}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(u.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filtered.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-10 text-sm text-gray-500" colSpan={8}>
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteMutation.error ? (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    Hata: {deleteMutation.error.message}
                </div>
            ) : null}
        </div>
    );
}
