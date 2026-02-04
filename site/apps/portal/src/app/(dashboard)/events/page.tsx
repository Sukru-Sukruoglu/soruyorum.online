"use client";

import { EventCard } from "@/components/events/EventCard";
import { Button } from "@ks-interaktif/ui";
import { Plus, Filter, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { deleteEvent } from "@/services/api";
import React, { useState, useEffect } from "react";
import CreateEventModal from "@/components/Event/CreateEventModal";
import { ENABLED_NEW_EVENT_CARD_DEFS, EVENT_TYPE_LABELS, getEventTypeLabel, type SupportedEventType } from "@/lib/eventTypes";

export default function EventsPage() {
    const router = useRouter();
    const [editingEvent, setEditingEvent] = React.useState<any>(null);
    const [creatingEvent, setCreatingEvent] = React.useState(false);
    const [createTemplate, setCreateTemplate] = React.useState<SupportedEventType>('quiz');
    const [createTitle, setCreateTitle] = React.useState<string>(EVENT_TYPE_LABELS.quiz.toUpperCase());
    const [createInitialStep, setCreateInitialStep] = React.useState<'template' | 'settings' | 'details'>('settings');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
                    <p className="text-gray-500">Tüm organizasyonlarınızın listesi</p>
                </div>
                <div className="flex gap-3">
                    <Button className="gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                        <Filter size={18} /> Filtrele
                    </Button>
                    <Button onClick={handleNewEventClick} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Plus size={18} /> Yeni Etkinlik
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        Yükleniyor...
                    </div>
                ) : isError ? (
                    <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-100">
                        <AlertCircle className="mx-auto mb-2" size={24} />
                        <p className="font-semibold">Etkinlikler yüklenemedi</p>
                        <p className="text-sm text-gray-500 mt-1">{error?.message}</p>
                        <Link href="/login" className="inline-block mt-3 text-sm text-red-600 hover:text-red-700 font-medium">
                            Giriş Yap →
                        </Link>
                    </div>
                ) : !events || events.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Henüz etkinlik yok.</div>
                ) : (
                    events.map((event: any) => (
                        <EventCard
                            key={event.id}
                            id={event.id}
                            title={event.name}
                            date={new Date(event.createdAt).toLocaleDateString("tr-TR")}
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
