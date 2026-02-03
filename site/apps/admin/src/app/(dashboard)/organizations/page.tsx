"use client";

import { Button } from "@ks-interaktif/ui";
import { Building2, Globe, Users } from "lucide-react";

export default function OrganizationsPage() {
    const orgs = [
        { id: 1, name: "Acme Corp", domain: "acme.com", plan: "Enterprise", seats: "12/50" },
        { id: 2, name: "StartUp Inc", domain: "startup.io", plan: "Pro", seats: "4/10" },
        { id: 3, name: "Global Tech", domain: "globaltech.net", plan: "Enterprise", seats: "45/100" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Organizasyonlar</h1>
                <Button className="bg-indigo-600 text-white">Yeni Organizasyon</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgs.map(org => (
                    <div key={org.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                <Building2 size={24} />
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${org.plan === 'Enterprise' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {org.plan}
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg mb-1">{org.name}</h3>
                        <div className="flex items-center text-gray-500 text-sm mb-4 gap-2">
                            <Globe size={14} />
                            {org.domain}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users size={16} />
                                {org.seats} Kullanıcı
                            </div>
                            <button className="text-indigo-600 text-sm font-medium hover:underline">Detaylar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
