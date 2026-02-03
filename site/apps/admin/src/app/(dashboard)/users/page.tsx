"use client";

import { Button } from "@ks-interaktif/ui";
import { Search, MoreHorizontal, Shield, ShieldAlert } from "lucide-react";

import { trpc } from "../../../utils/trpc";

export default function UsersPage() {
    const { data: users, isLoading } = trpc.users.list.useQuery();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                <Button className="bg-indigo-600 text-white">Yeni Kullanıcı Ekle</Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="İsim veya e-posta ara..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Kullanıcı</th>
                            <th className="px-6 py-3">Organizasyon</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-4 text-center">Yükleniyor...</td></tr>
                        ) : users?.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.organization?.name || "-"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {user.role === 'ADMIN' ? <Shield size={12} /> : null}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
