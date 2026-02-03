"use client";

import { Briefcase, Folder, Users, Clock, Plus, MoreVertical } from "lucide-react";

export default function WorkspacePage() {
    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Briefcase className="text-purple-500" />
                    Çalışma Alanım
                </h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition-all">
                    <Plus size={18} />
                    Yeni Klasör
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <WorkspaceFolder 
                    name="Kurumsal Etkinlikler"
                    itemCount={5}
                    lastModified="2 gün önce"
                />
                <WorkspaceFolder 
                    name="Eğitim Programları"
                    itemCount={8}
                    lastModified="1 hafta önce"
                />
                <WorkspaceFolder 
                    name="Arşiv"
                    itemCount={12}
                    lastModified="1 ay önce"
                />
            </div>

            <div className="mt-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-gray-400" />
                    Son Aktiviteler
                </h2>
                <div className="space-y-4">
                    <ActivityItem 
                        action="Etkinlik oluşturuldu"
                        item="Yıllık Değerlendirme"
                        time="2 saat önce"
                    />
                    <ActivityItem 
                        action="Etkinlik düzenlendi"
                        item="Ürün Lansmanı"
                        time="Dün"
                    />
                    <ActivityItem 
                        action="Klasöre taşındı"
                        item="Q4 Toplantısı → Arşiv"
                        time="3 gün önce"
                    />
                </div>
            </div>
        </div>
    );
}

function WorkspaceFolder({ name, itemCount, lastModified }: { name: string; itemCount: number; lastModified: string }) {
    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-purple-500 dark:hover:border-purple-500/50 transition-all cursor-pointer group shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700">
                    <Folder size={24} className="text-white" />
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all">
                    <MoreVertical size={16} className="text-gray-400" />
                </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <Users size={14} />
                    {itemCount} öğe
                </span>
                <span>{lastModified}</span>
            </div>
        </div>
    );
}

function ActivityItem({ action, item, time }: { action: string; item: string; time: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
            <div>
                <p className="text-gray-900 dark:text-white">{action}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item}</p>
            </div>
            <span className="text-sm text-gray-500">{time}</span>
        </div>
    );
}
