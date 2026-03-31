import { Calendar, Users, MoreVertical, Play, Edit, Settings, Trash, X } from "lucide-react";
import { Button } from "@ks-interaktif/ui";
import Link from "next/link";
import React, { useState } from "react";

interface EventCardProps {
    id: string; // Added ID
    title: string;
    date: string;
    participants: number;
    pin?: string;
    status: "active" | "draft" | "completed";
    type: string;
    qandaCount?: number;
    lastQandaAt?: string | null;
    onEditSettings?: () => void;
    onDelete?: () => void;
}

export function EventCard({ id, title, date, participants, pin, status, type, qandaCount, lastQandaAt, onEditSettings, onDelete }: EventCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const displayPin = typeof pin === 'string' && pin.trim().length > 0 ? pin.trim() : null;

    const statusColors = {
        active: "bg-green-900/30 text-green-400 border-green-700/30",
        draft: "bg-gray-800/30 text-gray-400 border-gray-700/30",
        completed: "bg-blue-900/30 text-blue-400 border-blue-700/30"
    };

    const statusLabels = {
        active: "Yayında",
        draft: "Proje",
        completed: "Sonlandı"
    };

    const hasQanda = (qandaCount ?? 0) > 0;
    const qandaLabel = hasQanda ? `🗨️ ${qandaCount}` : null;

    const displayStatus: "active" | "draft" | "completed" = (status === 'draft' && hasQanda) ? 'active' : status;

    return (
        <div className={`bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10 hover:border-red-500/30 hover:shadow-md transition-all group flex items-center justify-between relative ${showMenu ? 'z-50' : 'z-0'}`}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover:bg-red-900/20 group-hover:border-red-500/20 transition-colors">
                    {type === "Quiz" ? "❓" : type === "Vote" ? "📊" : "🎮"}
                </div>
                <div>
                    <h4 className="font-bold group-hover:text-red-400 transition-colors" style={{ color: "#fff" }}>{title}</h4>
                    <div className="flex items-center gap-4 text-xs mt-1" style={{ color: "#94a3b8" }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {participants}</span>
                        {displayPin && (
                            <span className="flex items-center gap-1 font-mono" title="Etkinlik PIN">
                                PIN {displayPin}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[displayStatus]}`}>
                    {statusLabels[displayStatus]}
                </span>

                {hasQanda && (
                    <span
                        className="px-2.5 py-1 rounded-full text-xs font-extrabold border bg-purple-900/30 text-purple-400 border-purple-700/30"
                        title={lastQandaAt ? `Son soru: ${new Date(lastQandaAt).toLocaleString('tr-TR')}` : 'Soru/cevap alındı'}
                    >
                        {qandaLabel}
                    </span>
                )}

                <div className="flex items-center gap-2">
                    <Link href={`/events/${id}`}>
                        <Button className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 bg-transparent hover:bg-green-900/20 border-0 flex items-center justify-center transition-colors" title="Etkinliğe Gir">
                            <Play size={16} />
                        </Button>
                    </Link>
                    <Link href={`/events/${id}/edit`}>
                        <Button className="h-8 w-8 p-0 text-indigo-400 bg-indigo-900/20 hover:bg-indigo-900/40 border-0 flex items-center justify-center transition-colors" title="Düzenle">
                            <Edit size={16} />
                        </Button>
                    </Link>
                    <div className="relative">
                        <Button
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 bg-transparent hover:bg-white/10 border-0 flex items-center justify-center"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical size={16} />
                        </Button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f2035] rounded-lg shadow-xl border border-white/10 z-[60] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                        onClick={() => {
                                            setShowMenu(false);
                                            onEditSettings?.();
                                        }}
                                    >
                                        <Settings size={14} className="text-gray-400" />
                                        Ayarları Düzenle
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                        onClick={() => {
                                            setShowMenu(false);
                                            onDelete?.();
                                        }}
                                    >
                                        <Trash size={14} className="text-red-400" />
                                        Etkinliği Sil
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
