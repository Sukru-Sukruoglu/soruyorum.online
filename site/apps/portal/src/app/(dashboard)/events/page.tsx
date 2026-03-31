"use client";

import { EventCard } from "@/components/events/EventCard";
import { Button } from "@ks-interaktif/ui";
import { Plus, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { formatDate } from "@/utils/formatDate";
import { deleteEvent } from "@/services/api";
import React, { useState, useEffect, useMemo } from "react";
import CreateEventModal from "@/components/Event/CreateEventModal";
import { ENABLED_NEW_EVENT_CARD_DEFS, EVENT_TYPE_LABELS, getEventTypeLabel, type SupportedEventType } from "@/lib/eventTypes";

export default function EventsPage() {
    const router = useRouter();
    const [editingEvent, setEditingEvent] = React.useState<any>(null);
    const [creatingEvent, setCreatingEvent] = React.useState(false);
    const [createTemplate, setCreateTemplate] = React.useState<SupportedEventType>('quiz');
    const [createTitle, setCreateTitle] = React.useState<string>(EVENT_TYPE_LABELS.quiz.toUpperCase());
    const [createInitialStep, setCreateInitialStep] = React.useState<'template' | 'settings' | 'details'>('settings');
    const [selectedFilter, setSelectedFilter] = React.useState<"all" | "active" | "draft" | "completed">("all");
    const [searchTerm, setSearchTerm] = React.useState("");
    const { data: events, isLoading, isError, error, refetch } = trpc.events.list.useQuery(undefined, {
        retry: false,
    });

    // Redirect to login if unauthorized
    useEffect(() => {
        if (isError && error?.data?.code === "UNAUTHORIZED") {
            router.push("/login");
        }
    }, [isError, error, router]);

    const handleEdit = (event: any) => {
        console.log("handleEdit triggered for event:", event);
        setEditingEvent(event);
    };

    const handleDelete = async (eventId: string) => {
        console.log("handleDelete triggered for event ID:", eventId);
        if (confirm("Bu etkinliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            try {
                await deleteEvent(eventId);
                refetch();
            } catch (error) {
                alert("Etkinlik silinirken bir hata oluştu.");
                console.error(error);
            }
        }
    };

    const handleNewEventClick = () => {
        // Always open as a popup from the dashboard (no navigation).
        // If only one type is enabled, jump directly into settings.
        if (ENABLED_NEW_EVENT_CARD_DEFS.length === 1) {
            const def = ENABLED_NEW_EVENT_CARD_DEFS[0];
            setCreateInitialStep('settings');
            setCreateTemplate(def.type);
            setCreateTitle(def.title.toUpperCase());
            setCreatingEvent(true);
            return;
        }

        // If multiple types are enabled, open the modal and let the user pick (template step).
        setCreateInitialStep('template');
        setCreateTemplate('quiz');
        setCreateTitle('ETKİNLİK');
        setCreatingEvent(true);
    };

    const safeEvents = useMemo(() => (Array.isArray(events) ? events : []), [events]);

    const counts = useMemo(() => {
        const base = { all: safeEvents.length, active: 0, draft: 0, completed: 0 };
        for (const event of safeEvents) {
            const status = String(event?.status || "").toLowerCase();
            if (status === "active") base.active += 1;
            else if (status === "completed") base.completed += 1;
            else base.draft += 1;
        }
        return base;
    }, [safeEvents]);

    const filteredEvents = useMemo(() => {
        return safeEvents.filter((event: any) => {
            const matchesFilter = selectedFilter === "all" || String(event?.status || "").toLowerCase() === selectedFilter;
            const matchesSearch =
                searchTerm.trim().length === 0 ||
                String(event?.name || "").toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                String((event as any)?.eventPin ?? (event as any)?.event_pin ?? (event as any)?.pin ?? "")
                    .toLowerCase()
                    .includes(searchTerm.trim().toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [safeEvents, searchTerm, selectedFilter]);

    const filterButtons: Array<{ key: "all" | "active" | "draft" | "completed"; label: string; accent: string }> = [
        { key: "all", label: "Tümü", accent: "text-white" },
        { key: "active", label: "Yayında", accent: "text-green-400" },
        { key: "draft", label: "Taslak", accent: "text-slate-300" },
        { key: "completed", label: "Sonlandı", accent: "text-blue-400" },
    ];

    return (
        <div className="space-y-8 p-8 pt-12 w-full overflow-x-hidden" style={{ color: "#fff" }}>
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: "#fff" }}>Etkinliklerim</h1>
                    <p className="mt-2 text-base font-light" style={{ color: "#94a3b8" }}>
                        Tüm etkinliklerinizi yönetin ve takip edin
                    </p>
                </div>
                <Button
                    onClick={handleNewEventClick}
                    className="flex items-center justify-center self-start bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2 shadow-lg shadow-red-900/20 border-0 rounded-full px-10 py-6 text-lg transition-all hover:scale-105"
                >
                    <Plus size={18} /> Yeni Etkinlik
                </Button>
            </div>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    {filterButtons.map((item) => {
                        const isActive = selectedFilter === item.key;
                        const count = counts[item.key];
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setSelectedFilter(item.key)}
                                className={`rounded-full px-5 py-3 text-sm font-bold transition-all ${
                                    isActive
                                        ? "bg-slate-950 text-white shadow-lg shadow-black/20"
                                        : "bg-white/10 hover:bg-white/15"
                                }`}
                                style={{
                                    border: isActive ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.06)",
                                    color: isActive ? "#fff" : undefined,
                                }}
                            >
                                <span className={isActive ? "text-white" : item.accent}>{item.label}</span>
                                <span className="ml-2 text-xs text-slate-400">{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full xl:max-w-[320px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Etkinlik ara..."
                        className="w-full rounded-2xl border px-12 py-4 text-sm outline-none transition-all"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.06)",
                            borderColor: "rgba(255,255,255,0.08)",
                            color: "#e2e8f0",
                        }}
                    />
                </div>
            </div>

            <div className="rounded-[28px] border p-6 shadow-xl" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
                            Yükleniyor...
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-red-400 bg-red-900/20 rounded-xl border border-red-800/30">
                            <AlertCircle className="mx-auto mb-2" size={24} />
                            <p className="font-semibold">Etkinlikler yüklenemedi</p>
                            <p className="text-sm text-gray-400 mt-1">{error?.message}</p>
                            <Link href="/login" className="inline-block mt-3 text-sm text-red-400 hover:text-red-300 font-medium">
                                Giriş Yap →
                            </Link>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            {safeEvents.length === 0 ? "Henüz etkinlik yok." : "Bu filtre için etkinlik bulunamadı."}
                        </div>
                    ) : (
                        filteredEvents.map((event: any) => (
                            <EventCard
                                key={event.id}
                                id={event.id}
                                title={event.name}
                                date={formatDate(event.createdAt)}
                                participants={event._count?.participants || 0}
                                pin={String((event as any)?.eventPin ?? (event as any)?.event_pin ?? (event as any)?.pin ?? '').trim() || undefined}
                                status={event.status.toLowerCase()}
                                qandaCount={event.qandaCount}
                                lastQandaAt={event.lastQandaAt}
                                eventType={event.event_type}
                                type={getEventTypeLabel(event.event_type)}
                                onEditSettings={() => handleEdit(event)}
                                onDelete={() => handleDelete(event.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
                        <p className="text-gray-500">Tüm organizasyonlarınızın listesi</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleNewEventClick} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Plus size={18} /> Yeni Etkinlik
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingEvent && (
                <CreateEventModal
                    onClose={() => setEditingEvent(null)}
                    onEventCreated={() => {
                        setEditingEvent(null);
                        refetch();
                    }}
                    eventToEdit={editingEvent}
                    displayTitle={`${(() => {
                        const rawType = (() => {
                            if (!editingEvent || typeof editingEvent !== 'object') return undefined;
                            const obj = editingEvent as Record<string, unknown>;
                            return obj.eventType ?? obj.event_type;
                        })();
                        if (rawType === 'quiz') return 'CANLI SORU';
                        if (rawType === 'poll') return 'ANKET';
                        const typeStr = typeof rawType === 'string' && rawType.trim() ? rawType : 'ETKİNLİK';
                        return typeStr.toUpperCase();
                    })()} - ETKİNLİK DÜZENLE`}
                />
            )}

            {/* Create Modal */}
            {creatingEvent && (
                <CreateEventModal
                    onClose={() => setCreatingEvent(false)}
                    initialStep={createInitialStep}
                    initialTemplate={createTemplate}
                    displayTitle={createTitle}
                    afterCreate="edit"
                    onEventCreated={(event) => {
                        // Refresh list (best-effort) and then go straight to edit page.
                        refetch();
                        setCreatingEvent(false);
                    }}
                />
            )}

            {/* 
               Correct approach: Import CreateEventModal at top.
            */}
        </div>
    );
}
