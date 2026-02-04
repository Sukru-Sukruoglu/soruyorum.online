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
        active: "bg-green-100 text-green-700 border-green-200",
        draft: "bg-gray-100 text-gray-600 border-gray-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200"
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
        <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xl group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                    {type === "Quiz" ? "❓" : type === "Vote" ? "📊" : "🎮"}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{title}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
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
                        className="px-2.5 py-1 rounded-full text-xs font-extrabold border bg-purple-50 text-purple-700 border-purple-200"
                        title={lastQandaAt ? `Son soru: ${new Date(lastQandaAt).toLocaleString('tr-TR')}` : 'Soru/cevap alındı'}
                    >
                        {qandaLabel}
                    </span>
                )}

                <div className="flex items-center gap-2">
                    <Link href={`/events/${id}`}>
                        <Button className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 bg-transparent hover:bg-green-50 border-0 flex items-center justify-center transition-colors" title="Etkinliğe Gir">
                            <Play size={16} />
                        </Button>
                    </Link>
                    <Link href={`/events/${id}/edit`}>
                        <Button className="h-8 w-8 p-0 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-0 flex items-center justify-center transition-colors" title="Düzenle">
                            <Edit size={16} />
                        </Button>
                    </Link>
                    <div className="relative">
                        <Button
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 bg-transparent hover:bg-gray-100 border-0 flex items-center justify-center"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical size={16} />
                        </Button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                        onClick={() => {
                                            setShowMenu(false);
                                            onEditSettings?.();
                                        }}
                                    >
                                        <Settings size={14} className="text-gray-400" />
                                        Ayarları Düzenle
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
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
