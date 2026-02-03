"use client";

import { BarChart2, TrendingUp, Users, Calendar, Eye, Zap } from "lucide-react";

export default function StatsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <BarChart2 className="text-blue-500" />
                İstatistikler
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={Calendar}
                    label="Toplam Etkinlik"
                    value="0"
                    change="—"
                    color="blue"
                />
                <StatCard 
                    icon={Users}
                    label="Toplam Katılımcı"
                    value="0"
                    change="—"
                    color="green"
                />
                <StatCard 
                    icon={Eye}
                    label="Toplam Görüntülenme"
                    value="0"
                    change="—"
                    color="purple"
                />
                <StatCard 
                    icon={Zap}
                    label="Aktif Oturum"
                    value="0"
                    change="—"
                    color="yellow"
                />
            </div>

            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Detaylı istatistik grafikleri yakında...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    color 
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    change: string; 
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: "from-blue-600 to-blue-700",
        green: "from-green-600 to-green-700",
        purple: "from-purple-600 to-purple-700",
        yellow: "from-yellow-600 to-yellow-700",
    };

    const normalizedChange = (change || "").replace(/\s/g, "").toLowerCase();
    const isNeutralChange = normalizedChange === "—" || normalizedChange === "-" || normalizedChange === "0" || normalizedChange === "0%";

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-sm">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-4`}>
                <Icon size={24} className="text-white" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
            <p className={`text-xs ${isNeutralChange ? "text-gray-500 dark:text-gray-400" : "text-green-600 dark:text-green-400"}`}>{change}</p>
        </div>
    );
}
