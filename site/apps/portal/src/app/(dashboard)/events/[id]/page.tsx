"use client";

import { trpc } from "../../../../utils/trpc";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { QandaModerator } from "../../../../components/events/QandaModerator";
import { updateEvent } from "../../../../services/api";

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [stoppingPresentation, setStoppingPresentation] = useState(false);
    const [downloadingReport, setDownloadingReport] = useState(false);
    const [multiJoinEnabled, setMultiJoinEnabled] = useState(true);

    const { data: event, isLoading, isError, error, refetch: refetchEvent } = trpc.events.getById.useQuery(id);

    // Redirect to login if unauthorized
    useEffect(() => {
        if (isError && error?.message?.includes('UNAUTHORIZED')) {
            router.push('/login');
        }
    }, [isError, error, router]);

    const eventStatus = (event as any)?.status as string | undefined;
    const qandaStopped = Boolean((event as any)?.settings?.qanda?.stopped);

    useEffect(() => {
        const enabled = (event as any)?.settings?.qanda?.allowMultipleQuestionsFromDevice !== false;
        setMultiJoinEnabled(Boolean(enabled));
    }, [event]);

    const downloadQandaReport = async (format: 'csv' | 'json' = 'csv') => {
        if (downloadingReport) return;
        setDownloadingReport(true);
        try {
            const response = await fetch(`/api/events/${id}/qanda/report?format=${format}`, {
                method: 'GET',
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || 'Rapor indirilemedi');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            const safeTitle = String((event as any)?.name || 'etkinlik')
                .replace(/[^\w\d\-_. ]+/g, '')
                .trim()
                .slice(0, 60) || 'etkinlik';
            a.href = url;
            a.download = `${safeTitle}-${id.slice(0, 8)}-rapor.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setDownloadingReport(false);
        }
    };

    // Opening the moderator panel means the operation has started; promote draft -> active.
    useEffect(() => {
        if (eventStatus !== 'draft') return;

        let cancelled = false;
        (async () => {
            try {
                await updateEvent(id, { status: 'active' });
                if (!cancelled) {
                    await refetchEvent();
                }
            } catch {
                // Best-effort only
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [eventStatus, id, refetchEvent]);

    if (isLoading) return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
    
    if (isError) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Etkinlik Yüklenemedi</h3>
                <p className="text-gray-500 mb-4">
                    {error?.message?.includes('UNAUTHORIZED') 
                        ? 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
                        : 'Bir hata oluştu.'}
                </p>
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Giriş Sayfasına Git →
                </Link>
            </div>
        );
    }
    
    if (!event) return <div className="text-center py-12 text-gray-500">Etkinlik bulunamadı.</div>;

    const status = (event as any).status as string | undefined;
    const statusLabel =
        status === 'draft' ? 'Proje' :
        status === 'active' ? 'Aktif' :
        status === 'completed' ? 'Sonlandı' :
        status ? status : '—';
    const statusBadgeClass =
        status === 'active'
            ? 'bg-green-50 text-green-700'
            : status === 'completed'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-indigo-50 text-indigo-600';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusBadgeClass}`}>
                                {statusLabel}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">ID: {event.id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                    <QandaModerator 
                        eventId={id}
                        eventPin={(event as any).eventPin || (event as any).event_pin || ''}
                        showMultiJoinButton
                        showTabletButton
                        multiJoinEnabled={multiJoinEnabled}
                        onMultiJoinClick={async () => {
                            const nextEnabled = !multiJoinEnabled;
                            setMultiJoinEnabled(nextEnabled);
                            try {
                                const response = await fetch(`/api/events/${id}/qanda/allow-multiple`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ enabled: nextEnabled }),
                                });

                                const data = await response.json().catch(() => null);
                                if (!response.ok) {
                                    throw new Error(data?.error || 'Çoklu katılım güncellenemedi');
                                }

                                await refetchEvent();
                            } catch (e: any) {
                                setMultiJoinEnabled(!nextEnabled);
                                window.alert(e?.message || 'Çoklu katılım güncellenemedi');
                            }
                        }}
                        showDownloadReport={qandaStopped || status === 'completed'}
                        downloadingReport={downloadingReport}
                        onDownloadReport={() => downloadQandaReport('csv')}
                        onStopPresentation={status === 'completed' || qandaStopped ? undefined : async () => {
                            if (stoppingPresentation) return;

                            const confirmed = window.confirm('Sunumu durdurmak istediğinize emin misiniz? Katılımcılar soru gönderemeyecek ve ekran "Soru gönderimi bitmiştir" gösterecek.');
                            if (!confirmed) return;

                            setStoppingPresentation(true);
                            try {
                                const response = await fetch(`/api/events/${id}/qanda/stop`, {
                                    method: 'POST',
                                });
                                const data = await response.json().catch(() => null);

                                if (!response.ok) {
                                    throw new Error(data?.error || 'Sunum durdurulamadı');
                                }

                                await refetchEvent();
                                window.alert('Sunum durduruldu.');
                            } catch (e: any) {
                                window.alert(e?.message || 'Sunum durdurulamadı');
                            } finally {
                                setStoppingPresentation(false);
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
