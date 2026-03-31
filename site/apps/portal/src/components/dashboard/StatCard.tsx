import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: LucideIcon;
    color: string; // Expecting classes like "from-red-500 to-red-600" for gradients
}

export function StatCard({ title, value, change, isPositive, icon: Icon, color }: StatCardProps) {
    const normalizedChange = (change || "").replace(/\s/g, "").toLowerCase();
    const isNeutralChange =
        normalizedChange === "—" ||
        normalizedChange === "-" ||
        normalizedChange === "0" ||
        normalizedChange === "0%" ||
        normalizedChange === "0.0" ||
        normalizedChange === "0.0%";

    return (
        <div className="relative group overflow-hidden bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-sm hover:shadow-md hover:border-white/20 transition-all duration-300">
            {/* Hover Gradient Background (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p style={{ color: "#94a3b8" }} className="font-medium text-sm mb-1">{title}</p>
                    <h3 style={{ color: "#fff" }} className="text-3xl font-bold mb-2 tracking-tight">{value}</h3>
                    {isNeutralChange ? (
                        <p className="text-xs font-semibold flex items-center gap-1 text-gray-500">
                            — <span className="text-gray-500 font-normal ml-1">değişim yok</span>
                        </p>
                    ) : (
                        <p className={`text-xs font-semibold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? "↑" : "↓"} {change}
                            <span className="text-gray-500 font-normal ml-1">geçen aya göre</span>
                        </p>
                    )}
                </div>

                {/* Icon Container */}
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );
}
