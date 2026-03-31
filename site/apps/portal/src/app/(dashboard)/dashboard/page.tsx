"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@ks-interaktif/ui";
import { Users, Play, Calendar, TrendingUp, Plus, Activity, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { formatDate } from "@/utils/formatDate";
import { useRouter } from "next/navigation";

import { deleteEvent } from "@/services/api";
import React, { useState, useEffect } from "react";
import CreateEventModal from "@/components/Event/CreateEventModal";
import { ENABLED_NEW_EVENT_CARD_DEFS, EVENT_TYPE_LABELS, type SupportedEventType } from "@/lib/eventTypes";

export default function DashboardPage() {
    const router = useRouter();
    const { data: me } = trpc.users.me.useQuery(undefined, { retry: false });
    const { data: events, isLoading, isError, error, refetch } = trpc.events.list.useQuery(undefined, {
        retry: false,
    });
    const { data: stats, isError: statsIsError, error: statsError } = trpc.dashboard.getStats.useQuery(undefined, {
        retry: false,
    });
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [createTemplate, setCreateTemplate] = useState<SupportedEventType>('quiz');
    const [createTitle, setCreateTitle] = useState<string>(EVENT_TYPE_LABELS.quiz.toUpperCase());
    const [createInitialStep, setCreateInitialStep] = useState<'template' | 'settings' | 'details'>('settings');

    const formatNumberTr = (value: number) => value.toLocaleString("tr-TR");
    const formatPctTr = (value: number) => `%${Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;



    const safeStatus = (value: unknown): "active" | "draft" | "completed" => {
        const s = String(value || "draft").toLowerCase();
        if (s === "active" || s === "draft" || s === "completed") return s;
        return "draft";
    };

    // Redirect to login if unauthorized
    useEffect(() => {
        if (isError && error?.data?.code === "UNAUTHORIZED") {
            router.push("/login");
        }
    }, [isError, error, router]);

    useEffect(() => {
        if (statsIsError && statsError?.data?.code === "UNAUTHORIZED") {
            router.push("/login");
        }
    }, [statsIsError, statsError, router]);

    const totalParticipantsValue = stats ? formatNumberTr(stats.totalParticipants) : "0";
    const participantsChange = stats ? formatPctTr(stats.participantsChangePct) : "—";
    const participantsIsPositive = Boolean(stats && stats.participantsChangePct >= 0);

    const activeEventsValue = stats ? formatNumberTr(stats.activeEvents) : "0";

    const meetingsValue = stats ? formatNumberTr(stats.meetingsThisMonth) : "0";
    const meetingsChange = stats ? formatPctTr(stats.meetingsChangePct) : "—";
    const meetingsIsPositive = Boolean(stats && stats.meetingsChangePct >= 0);

    const engagementValue = stats ? `%${Math.round(stats.engagementRate)}` : "%0";
    const engagementChange = stats ? formatPctTr(stats.engagementRateDelta) : "—";
    const engagementIsPositive = Boolean(stats && stats.engagementRateDelta >= 0);
    const hasEvents = (events?.length ?? 0) > 0;

    const handleEdit = (event: any) => {
        setEditingEvent(event);
    };

    const handleDelete = async (eventId: string) => {
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
        // Always open as a popup (no navigation).
        if (ENABLED_NEW_EVENT_CARD_DEFS.length === 1) {
            const def = ENABLED_NEW_EVENT_CARD_DEFS[0];
            setCreateInitialStep('settings');
            setCreateTemplate(def.type);
            setCreateTitle(def.title.toUpperCase());
            setCreatingEvent(true);
            return;
        }

        setCreateInitialStep('template');
        setCreateTemplate('quiz');
        setCreateTitle('ETKİNLİK');
        setCreatingEvent(true);
    };

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 break-words">
                        Hoş geldin,{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-600">
                            {(me?.name && me.name.trim().length > 0 ? me.name : "Admin") + " 👋"}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1 font-light text-sm sm:text-base">Bugün etkinliklerinizde neler oluyor?</p>
                </div>
                <Button
                    onClick={handleNewEventClick}
                    className="shrink-0 flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2 shadow-lg shadow-red-900/20 border-0 rounded-full px-6 sm:px-10 py-4 sm:py-6 text-sm sm:text-lg transition-all hover:scale-105 w-full sm:w-auto"
                >
                    <Plus size={18} /> Yeni Etkinlik
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <StatCard
                    title="Toplam Katılımcı"
                    value={totalParticipantsValue}
                    change={participantsChange}
                    isPositive={participantsIsPositive}
                    icon={Users}
                    color="from-purple-500 to-purple-600"
                />
                <StatCard
                    title="Aktif Etkinlikler"
                    value={activeEventsValue}
                    change="—"
                    isPositive={true}
                    icon={Play}
                    color="from-green-500 to-green-600"
                />
                <StatCard
                    title="Bu Ay Toplantılar"
                    value={meetingsValue}
                    change={meetingsChange}
                    isPositive={meetingsIsPositive}
                    icon={Calendar}
                    color="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Etkileşim Oranı"
                    value={engagementValue}
                    change={engagementChange}
                    isPositive={engagementIsPositive}
                    icon={TrendingUp}
                    color="from-orange-500 to-orange-600"
                />
            </div>

            {/* Recent Events & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Left: Events List */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Son Etkinlikler</h2>
                        <Link href="/events" className="text-sm text-red-600 font-medium hover:text-red-700 transition-colors">Tümünü Gör</Link>
                    </div>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
                                Yükleniyor...
                            </div>
                        ) : isError ? (
                            <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
                                <AlertCircle className="mx-auto mb-2" size={24} />
                                <p className="font-medium">Etkinlikler yüklenemedi</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {error?.message || "Bir hata oluştu"}
                                </p>
                                <Link href="/login" className="inline-block mt-3 text-sm text-red-600 hover:text-red-700 font-medium">
                                    Giriş Yap →
                                </Link>
                            </div>
                        ) : events?.length === 0 ? (
                            <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-5 sm:p-8 shadow-sm min-h-[300px] sm:min-h-[340px] flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-red-600">
                                        Etkinlik Yok
                                    </div>
                                    <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                                        İlk etkinliğinizi birkaç adımda başlatın
                                    </h3>
                                    <p className="mt-2 sm:mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                                        EVENT PASS hesabınızla hemen yeni bir etkinlik oluşturabilir, PIN veya QR ile katılımcı toplayabilir ve moderasyon ekranından yayına alabilirsiniz.
                                    </p>
                                </div>

                                <div className="mt-5 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                            <Plus size={20} />
                                        </div>
                                        <p className="text-sm font-black text-gray-900">1. Etkinliği oluştur</p>
                                        <p className="mt-2 text-sm text-gray-500">Başlığı girin, temel ayarları kaydedin ve sistemin PIN üretmesine izin verin.</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                            <Calendar size={20} />
                                        </div>
                                        <p className="text-sm font-black text-gray-900">2. PIN veya QR paylaş</p>
                                        <p className="mt-2 text-sm text-gray-500">Katılımcılarınızı oluşturulan link veya QR kod üzerinden doğrudan etkinliğe alın.</p>
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                                            <Play size={20} />
                                        </div>
                                        <p className="text-sm font-black text-gray-900">3. Yayına alın</p>
                                        <p className="mt-2 text-sm text-gray-500">Soruları yönetin, moderasyonu açın ve ekran yansıtma ile canlı akışı başlatın.</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        onClick={handleNewEventClick}
                                        className="inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2 border-0 rounded-full px-6 py-3 text-sm font-semibold"
                                    >
                                        <Plus size={16} /> Yeni Etkinlik
                                    </Button>
                                    <Link href="/how-to" className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
                                        Kurulum Adımlarını Gör
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            events?.slice(0, 10).map((event: any) => (
                                <EventCard
                                    key={event.id}
                                    id={event.id} // Pass ID
                                    title={event.name}
                                    date={formatDate(event?.createdAt ?? event?.created_at)}
                                    participants={event._count?.participants || 0}
                                    pin={String((event as any)?.eventPin ?? (event as any)?.event_pin ?? (event as any)?.pin ?? '').trim() || undefined}
                                    status={safeStatus(event?.status)}
                                    type={event.eventType === 'quiz' ? 'Canlı Soru' : event.eventType === 'poll' ? 'Anket' : event.eventType === 'tombala' ? 'Tombala' : 'Quiz'}
                                    onEditSettings={() => handleEdit(event)}
                                    onDelete={() => handleDelete(event.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions / Tips */}
                <div className={`space-y-6 ${hasEvents ? "" : "lg:pt-2"}`}>
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white shadow-xl shadow-gray-900/10">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={100} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-400" /> Nasıl Kullanılır?
                        </h3>
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed relative z-10">
                            SoruSor etkinliğini 2 dakikada başlatın: etkinlik oluştur → PIN/QR paylaş → moderasyondan onayla → ekranda yayınla.
                        </p>
                        <Link href="/how-to" className="relative z-10 inline-block">
                            <Button className="bg-white/10 text-white hover:bg-white/20 border-0 h-9 px-4 text-xs font-bold rounded-lg backdrop-blur-sm">
                                Nasıl Kullanılır?
                            </Button>
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-green-500" /> Sistem Durumu
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-500">
                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></span> API Server
                                </span>
                                <span className="text-green-600 font-bold font-mono">OK</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-500">
                                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></span> WebSocket
                                </span>
                                <span className="text-green-600 font-bold font-mono">54ms</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-500">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></span> Database
                                </span>
                                <span className="text-blue-600 font-bold font-mono">Ac.</span>
                            </div>
                        </div>
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
                    displayTitle={`${(editingEvent.eventType || editingEvent.event_type) === 'quiz' ? 'CANLI SORU' : (editingEvent.eventType || editingEvent.event_type) === 'poll' ? 'ANKET' : ((editingEvent.eventType || editingEvent.event_type) || 'ETKİNLİK').toUpperCase()} - ETKİNLİK DÜZENLE`}
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
                    onEventCreated={() => {
                        refetch();
                        setCreatingEvent(false);
                    }}
                />
            )}
        </div>
    );
}
