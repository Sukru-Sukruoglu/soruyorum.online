"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "../../utils/trpc";
import { formatDate } from "../../utils/formatDate";
import { fetchPortalAuthSession } from "../../utils/authSession";
import { isSuperAdminRole, hasFullAccessRole } from "../../utils/auth";
import {
    Check,
    X,
    MessageSquare,
    RefreshCw,
    Users,
    Eye,
    EyeOff,
    Monitor,
    StopCircle,
    Undo2,
    Trash2,
    Clock,
    ExternalLink,
    Copy,
} from "lucide-react";

const LIVE_QR_SYNC_KEY = 'soruyorum_live_qr_sync';

interface QandaModeratorProps {
    eventId: string;
    eventPin?: string;
    onStopPresentation?: () => void;
    showDownloadReport?: boolean;
    downloadingReport?: boolean;
    onDownloadReport?: () => void;
    showMultiJoinButton?: boolean;
    multiJoinEnabled?: boolean;
    onMultiJoinClick?: () => void;
    showTabletButton?: boolean;
    showPresentationButton?: boolean;
    mode?: 'default' | 'tablet';
}

export function QandaModerator({
    eventId,
    eventPin,
    onStopPresentation,
    showDownloadReport,
    downloadingReport,
    onDownloadReport,
    showMultiJoinButton,
    multiJoinEnabled,
    onMultiJoinClick,
    showTabletButton,
    showPresentationButton = true,
    mode = 'default',
}: QandaModeratorProps) {
    // State
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [showParticipants, setShowParticipants] = useState(true);
    const [currentShownQuestionId, setCurrentShownQuestionId] = useState<string | null>(null);
    const [serverTime, setServerTime] = useState<string>("--:--:--");
    const [tabletStopping, setTabletStopping] = useState(false);
    const [tabletStopped, setTabletStopped] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const questionsListRef = useRef<HTMLDivElement>(null);

    const [showTabletQr, setShowTabletQr] = useState(false);
    const [tabletUrl, setTabletUrl] = useState<string>('');
    const [tabletTokenLoading, setTabletTokenLoading] = useState(false);
    const [tabletTokenError, setTabletTokenError] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    const presentationWindowRef = useRef<Window | null>(null);
    const presentationOriginRef = useRef<string | null>(null);
    const [liveQrExpanded, setLiveQrExpanded] = useState(false);
    const [presentationView, setPresentationView] = useState<'join' | 'wall' | 'rotate'>('join');
    const [eventSettingsCache, setEventSettingsCache] = useState<any>({});
    const [modeSaving, setModeSaving] = useState(false);

    useEffect(() => {
        setLiveQrExpanded(false);
    }, [eventId]);

    // In tablet mode, poll the DB for live QR state so the button label stays in sync
    const lastQrSyncRef = useRef<string | null>(null);
    const { data: publicEventInfo } = trpc.events.getPublicInfo.useQuery(
        { id: eventId },
        { enabled: mode === 'tablet', refetchInterval: mode === 'tablet' ? 1500 : false },
    );

    useEffect(() => {
        if (mode !== 'tablet' || !publicEventInfo) return;
        const commandAt = String((publicEventInfo as any)?.liveQrCommandAt || '').trim();
        if (!commandAt || lastQrSyncRef.current === commandAt) return;
        lastQrSyncRef.current = commandAt;
        setLiveQrExpanded(Boolean((publicEventInfo as any)?.liveQrExpanded));
    }, [mode, publicEventInfo]);

    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (mounted) setRole(session.role);
            })
            .catch(() => {
                if (mounted) setRole(null);
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const isAllowedOrigin = (origin: string) => {
            if (origin === window.location.origin) return true;
            try {
                const url = new URL(origin);
                const host = (url.hostname || '').toLowerCase();
                return (
                    host === 'soruyorum.online' ||
                    host.endsWith('.soruyorum.online') ||
                    host.includes('192.168.68.73') ||
                    host.includes('localhost')
                );
            } catch {
                return false;
            }
        };

        const handler = (e: MessageEvent) => {
            if (!e?.origin || !isAllowedOrigin(e.origin)) return;
            const data = (e.data || {}) as any;
            if (!data) return;
            if (data.type !== 'SORUYORUM_LIVE_QR_STATE') return;
            if (data.eventId && String(data.eventId) !== String(eventId)) return;

            setLiveQrExpanded(Boolean(data.expanded));
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [eventId]);

    const getPresentationOrigin = () => {
        return window.location.origin;
    };

    const buildPresentationUrl = (view?: 'join' | 'wall' | 'rotate') => {
        const screenOrigin = getPresentationOrigin();
        const base = `${screenOrigin}/events/${eventId}/live`;
        return view ? `${base}?view=${view}` : base;
    };

    const openOrGetPresentationWindow = (view?: 'join' | 'wall' | 'rotate') => {
        const existing = presentationWindowRef.current;
        const targetUrl = buildPresentationUrl(view);
        if (existing && !existing.closed) return existing;

        const screenOrigin = getPresentationOrigin();
        const newWindow = window.open(targetUrl, 'sunumEkrani', 'fullscreen=yes,menubar=no,toolbar=no,location=no,status=no');
        if (newWindow) {
            presentationWindowRef.current = newWindow;
            presentationOriginRef.current = screenOrigin;
            newWindow.focus();
        }
        return newWindow;
    };

    const navigatePresentationWindow = (
        view?: 'join' | 'wall' | 'rotate',
        createIfMissing = false,
    ) => {
        const existing = presentationWindowRef.current;
        const w = createIfMissing
            ? openOrGetPresentationWindow(view)
            : existing && !existing.closed
                ? existing
                : null;
        if (!w) return false;

        const targetUrl = buildPresentationUrl(view);
        try {
            if (w.location.href !== targetUrl) {
                w.location.href = targetUrl;
            }
            w.focus();
        } catch {
            // ignore
        }

        return true;
    };

    const requestLiveQrExpand = (expanded: boolean, options?: { silent?: boolean }) => {
        void setLiveQrExpandedMutation.mutateAsync({ eventId, expanded }).catch(() => {
            // ignore command persistence failures; same-device messaging may still work
        });

        try {
            localStorage.setItem(
                LIVE_QR_SYNC_KEY,
                JSON.stringify({ eventId, expanded, ts: Date.now() })
            );
        } catch {
            // ignore storage failures
        }

        if (mode === 'tablet') {
            return;
        }

        const w = openOrGetPresentationWindow();
        if (!w) {
            if (!options?.silent) {
                window.alert('Sunum ekranı açılamadı (popup engeli olabilir). Önce "Sunum Ekranı" butonuna basın.');
            }
            return;
        }

        const targetOrigin = presentationOriginRef.current || '*';
        const payload = { type: 'SORUYORUM_LIVE_QR_EXPAND', eventId, expanded };

        try {
            w.postMessage(payload, targetOrigin);
            setTimeout(() => {
                try {
                    w.postMessage(payload, targetOrigin);
                } catch {
                    // ignore
                }
            }, 600);
        } catch {
            // ignore
        }
    };

    const toggleLiveQrExpand = () => {
        const next = !liveQrExpanded;
        setLiveQrExpanded(next);
        requestLiveQrExpand(next);
    };

    const toggleLiveQrFromTablet = () => {
        const next = !liveQrExpanded;
        setLiveQrExpanded(next);
        requestLiveQrExpand(next);
    };

    const handleTabletStopPresentation = async () => {
        if (tabletStopping || tabletStopped) return;
        const confirmed = window.confirm('Sunumu bitirmek istediğinize emin misiniz?\n\nKatılımcılar artık soru gönderemeyecek.');
        if (!confirmed) return;
        setTabletStopping(true);
        try {
            const res = await fetch(`/api/events/${eventId}/qanda/stop`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'Sunum durdurulamadı');
            }
            setTabletStopped(true);
            window.alert('Sunum başarıyla bitirildi.');
        } catch (e: any) {
            window.alert(e?.message || 'Sunum durdurulamadı');
        } finally {
            setTabletStopping(false);
        }
    };

    useEffect(() => {
        const loadMode = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                if (!res.ok) return;

                const data = await res.json();
                const settings = (data as any)?.event?.settings || {};
                setEventSettingsCache(settings);

                const mode = ((settings as any)?.qanda?.screenMode as string | undefined) || 'wall';
                const normalized = mode === 'rotate' ? 'rotate' : 'wall';
                setPresentationView(normalized);
            } catch {
                // ignore
            }
        };

        void loadMode();
    }, [eventId]);

    const persistPresentationMode = async (mode: 'wall' | 'rotate') => {
        try {
            setModeSaving(true);
            setPresentationView(mode);

            const prevSettings = eventSettingsCache || {};
            const nextSettings = {
                ...prevSettings,
                qanda: {
                    ...((prevSettings as any)?.qanda || {}),
                    screenMode: mode,
                },
            };

            const res = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings: nextSettings }),
            });

            if (!res.ok) {
                let msg = 'Ekran görünümü kaydedilemedi.';
                try {
                    const payload = await res.json();
                    msg = payload?.error || msg;
                } catch {
                    // ignore
                }
                window.alert(msg);
                return;
            }

            const payload = await res.json();
            const updatedSettings = (payload as any)?.event?.settings || nextSettings;
            setEventSettingsCache(updatedSettings);

            // If a presentation window is already open, refresh it to canonical
            // URL (no forced view) so persisted mode is used.
            navigatePresentationWindow(undefined, false);
        } catch {
            window.alert('Ekran görünümü kaydedilemedi.');
        } finally {
            setModeSaving(false);
        }
    };

    // TRPC Queries
    const { data: questions, refetch: refetchQuestions, isLoading } = trpc.qanda.getQuestions.useQuery(
        { eventId },
        { refetchInterval: 3000 }
    );

    const {
        data: participantsRaw,
        refetch: refetchParticipants,
        isFetching: isFetchingParticipants,
        error: participantsError,
    } = trpc.events.getParticipants.useQuery(eventId, {
        refetchInterval: showParticipants ? 5000 : false,
    });

    const participants = (participantsRaw || []).map((p: any) => {
        const lastSeenAt = (p as any).lastSeenAt ?? (p as any).last_seen_at;
        const d = lastSeenAt ? new Date(lastSeenAt) : null;
        const isOnline = Boolean(d && !Number.isNaN(d.getTime()) && d.getTime() > Date.now() - 60_000);
        return { ...p, isOnline };
    });

    // Mutations
    const updateStatus = trpc.qanda.updateStatus.useMutation({
        onSuccess: () => refetchQuestions()
    });
    const deleteQuestion = trpc.qanda.deleteQuestion.useMutation({
        onSuccess: () => refetchQuestions()
    });
    const markAsAnswered = trpc.qanda.markAsAnswered.useMutation({
        onSuccess: () => refetchQuestions()
    });

    const setFeaturedQuestionMutation = trpc.qanda.setFeaturedQuestion.useMutation({
        onSuccess: (res) => {
            setCurrentShownQuestionId((res as any)?.featuredQuestionId ?? null);
        },
    });

    const setLiveQrExpandedMutation = trpc.qanda.setLiveQrExpanded.useMutation();

    const kickParticipantMutation = trpc.events.kickParticipant.useMutation({
        onSuccess: async () => {
            await refetchParticipants();
        },
    });

    // Server time sync
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setServerTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Anonymous mode persistence
    useEffect(() => {
        const stored = localStorage.getItem(`anonymous_mode_${eventId}`);
        if (stored === '1') setAnonymousMode(true);
    }, [eventId]);

    const toggleAnonymousMode = async () => {
        const newValue = !anonymousMode;
        setAnonymousMode(newValue);
        localStorage.setItem(`anonymous_mode_${eventId}`, newValue ? '1' : '0');

        // Persist to server so the presentation screen (different subdomain) can respect it.
        try {
            await fetch(`/api/events/${eventId}/qanda/anonymous`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: newValue }),
            });
        } catch {
            // ignore
        }
    };

    // Question filtering
    const allQuestions = questions || [];
    const pendingQuestions = allQuestions.filter((q: any) => q.status === 'pending');
    const approvedQuestions = allQuestions.filter((q: any) => q.status === 'approved');
    const participantCount = participants?.length || 0;
    const isInitialParticipantsLoading = participantsRaw == null && isFetchingParticipants;

    // Manual refresh
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refetchQuestions(), refetchParticipants()]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Show on screen (cross-subdomain) via server state
    const handleShowOnScreen = useCallback((questionId: string) => {
        const newId = questionId === currentShownQuestionId ? null : questionId;
        setCurrentShownQuestionId(newId);
        setFeaturedQuestionMutation.mutate({ eventId, questionId: newId });
    }, [currentShownQuestionId, eventId, setFeaturedQuestionMutation.mutate]);

    // Close fullscreen
    const handleCloseFullScreen = () => {
        setCurrentShownQuestionId(null);
        setFeaturedQuestionMutation.mutate({ eventId, questionId: null });
    };

    // Delete question
    const handleDeleteQuestion = async (questionId: string) => {
        if (confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
            deleteQuestion.mutate({ id: questionId });
        }
    };

    // Anonymize name
    const displayName = (name: string) => {
        if (!anonymousMode) return name || 'Anonim';
        if (!name || name === 'Anonim') return 'Anonim';
        const trimmed = name.trim();
        if (!trimmed) return 'Anonim';
        const firstChar = Array.from(trimmed)[0] || 'A';
        const upper = firstChar.toLocaleUpperCase('tr-TR');
        return `${upper}***`;
    };

    const displayInitial = (name: string) => {
        const label = displayName(name);
        const trimmed = (label || '').trim();
        const first = Array.from(trimmed)[0] || 'A';
        return first.toLocaleUpperCase('tr-TR');
    };

    // Format time ago
    const getTimeAgo = (date: string | Date) => {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);

        if (diffSec < 60) return 'Az önce';
        if (diffMin < 60) return `${diffMin} dk önce`;
        if (diffHour < 24) return `${diffHour} saat önce`;
        return formatDate(then);
    };

    const getTabletHost = () => {
        if (hasFullAccessRole(role)) {
            return 'https://soruyorum.online';
        }

        return window.location.origin;
    };

    const buildTabletBaseUrl = () => `${getTabletHost()}/tablet/events/${eventId}`;

    const ensureTabletUrl = async () => {
        setTabletTokenLoading(true);
        setTabletTokenError(null);

        const baseUrl = buildTabletBaseUrl();

        try {
            const res = await fetch(`/api/events/${eventId}/tablet/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                let msg = 'Tablet token alınamadı.';
                try {
                    const data = await res.json();
                    msg = data?.error || msg;
                } catch {
                    // ignore
                }
                setTabletUrl(baseUrl);
                setTabletTokenError(`${msg} Tablet ekranında giriş istenebilir.`);
                return baseUrl;
            }

            const data = await res.json();
            const shortToken = String(data?.token || '');
            if (!shortToken) {
                setTabletUrl(baseUrl);
                setTabletTokenError('Tablet token boş döndü. Tablet ekranında giriş istenebilir.');
                return baseUrl;
            }

            const urlWithToken = `${baseUrl}?t=${encodeURIComponent(shortToken)}`;
            setTabletUrl(urlWithToken);
            return urlWithToken;
        } catch {
            setTabletUrl(baseUrl);
            setTabletTokenError('Tablet token alınamadı. Tablet ekranında giriş istenebilir.');
            return baseUrl;
        } finally {
            setTabletTokenLoading(false);
        }
    };

    const openTabletQrModal = async () => {
        setShowTabletQr(true);
        await ensureTabletUrl();
    };

    const openTabletInNewTab = async () => {
        const url = await ensureTabletUrl();
        window.open(url, 'tabletEkrani');
    };

    // Copy PIN
    const copyPin = () => {
        if (eventPin) {
            navigator.clipboard.writeText(eventPin);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl">
                <div className="text-center text-white">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="font-medium">Sorular yükleniyor...</p>
                </div>
            </div>
        );
    }

    const tabletQrCodeUrl = tabletUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(tabletUrl)}`
        : '';

    return (
        <>
            <div className="h-[calc(100vh-120px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative" style={{ backgroundColor: '#11223D' }}>
                {/* Background glow effects - matching 'Neden Soru-Yorum' section */}
                {/* shape-3: floating decorative image */}
                <img
                    src="/assets/images/shapes/why-choose-one-shape-3.png"
                    alt=""
                    className="absolute pointer-events-none z-[1]"
                    style={{
                        top: 0,
                        right: 35,
                        opacity: 0.10,
                        animation: 'floatBobY 3s ease-in-out infinite',
                    }}
                />
                {/* shape-4: indigo glow from left */}
                <div
                    className="absolute pointer-events-none z-0"
                    style={{
                        left: '-5%',
                        right: '50%',
                        top: '0%',
                        bottom: '0%',
                        opacity: 0.7,
                        filter: 'blur(80px)',
                        background: 'radial-gradient(50% 50% at 50% 50%, #6669D8 0%, rgba(7, 12, 20, 0) 100%)',
                    }}
                />
                {/* shape-5: pink glow from right */}
                <div
                    className="absolute pointer-events-none z-0"
                    style={{
                        left: '55%',
                        right: '0%',
                        top: '0%',
                        bottom: '0%',
                        opacity: 0.6,
                        filter: 'blur(80px)',
                        background: 'radial-gradient(50% 50% at 50% 50%, rgba(250, 86, 116, 0.63) 0%, rgba(7, 12, 20, 0) 100%)',
                    }}
                />
                {/* Header */}
                <div className="relative z-10 bg-[#11223D]/60 backdrop-blur-xl px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                🎯 Moderator Panel
                            </h2>
                            {eventPin && (
                                <div
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold text-lg tracking-[0.2em] cursor-pointer hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2"
                                    onClick={copyPin}
                                    title="Kopyalamak için tıklayın"
                                >
                                    {eventPin.slice(0, 4)} {eventPin.slice(4)}
                                    <Copy size={14} />
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-black text-indigo-400 tabular-nums">{serverTime}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sunucu Saati</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-white">{allQuestions.length}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Toplam Soru</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-amber-400">{pendingQuestions.length}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gelen</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-green-400">{approvedQuestions.length}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Gösteriliyor</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-black text-indigo-400">{participantCount}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Katılımcı</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${isRefreshing
                                ? 'bg-green-100 text-green-700'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                                }`}
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            🔄 Yenile
                        </button>

                        <button
                            onClick={toggleAnonymousMode}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${anonymousMode
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            🕶️ Anonim: {anonymousMode ? 'Açık' : 'Kapalı'}
                        </button>

                        {showMultiJoinButton && (
                            <button
                                onClick={onMultiJoinClick}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${multiJoinEnabled
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25'
                                    : 'bg-white/10 hover:bg-white/20 text-gray-300 shadow-none'
                                    }`}
                                type="button"
                            >
                                ✓ Çoklu Katılım: {multiJoinEnabled ? 'Açık' : 'Kapalı'}
                            </button>
                        )}

                        <button
                            onClick={() => setShowParticipants(!showParticipants)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${showParticipants
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                        >
                            <Users size={16} />
                            👥 Katılımcılar
                        </button>

                        {showPresentationButton && mode !== 'tablet' && (
                            <button
                                onClick={() => {
                                    navigatePresentationWindow(undefined, true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25"
                            >
                                <Monitor size={16} />
                                📺 Sunum Ekranı
                            </button>
                        )}

                        {showPresentationButton && mode !== 'tablet' && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/10 border border-white/15">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPresentationView('join');
                                        const ok = navigatePresentationWindow('join', false);
                                        if (!ok) {
                                            window.alert('Önce "Sunum Ekranı" butonuyla ekranı açın.');
                                        }
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${presentationView === 'join' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/15'}`}
                                >
                                    Giriş
                                </button>
                                <button
                                    type="button"
                                    disabled={modeSaving}
                                    onClick={() => {
                                        void persistPresentationMode('wall');
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${presentationView === 'wall' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/15'} ${modeSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    Duvar
                                </button>
                                <button
                                    type="button"
                                    disabled={modeSaving}
                                    onClick={() => {
                                        void persistPresentationMode('rotate');
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${presentationView === 'rotate' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/15'} ${modeSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    Tek tek
                                </button>
                            </div>
                        )}

                        {Boolean(eventPin) && (
                            <button
                                onClick={mode === 'tablet' ? toggleLiveQrFromTablet : toggleLiveQrExpand}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'tablet' ? (liveQrExpanded ? 'bg-green-600 text-white hover:bg-green-700 border border-green-500' : 'bg-red-600 text-white hover:bg-red-700 border border-red-500') : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'}`}
                                type="button"
                            >
                                {mode === 'tablet' ? (liveQrExpanded ? "Sunumdaki QR'ı kapat" : "Sunumdaki QR'ı büyüt") : liveQrExpanded ? "QR'ı kapat" : "QR'ı büyüt"}
                            </button>
                        )}

                        {showTabletButton && (
                            <button
                                onClick={openTabletQrModal}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20"
                                type="button"
                            >
                                Tablet Ekranı
                            </button>
                        )}

                        {mode === 'tablet' && !tabletStopped && (
                            <button
                                onClick={handleTabletStopPresentation}
                                disabled={tabletStopping}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/25 ${tabletStopping ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white`}
                                type="button"
                            >
                                {tabletStopping ? '⏳ Durduruluyor…' : '🛑 Sunumu Bitir'}
                            </button>
                        )}

                        {mode === 'tablet' && tabletStopped && (
                            <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-600 text-gray-300 border border-gray-500">
                                ✅ Sunum Bitirildi
                            </span>
                        )}

                        {onStopPresentation && (
                            <button
                                onClick={onStopPresentation}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold text-sm transition-all shadow-lg shadow-red-500/25"
                            >
                                🛑 Sunumu Durdur
                            </button>
                        )}

                        {showDownloadReport && onDownloadReport && (
                            <button
                                onClick={onDownloadReport}
                                disabled={Boolean(downloadingReport)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 font-bold text-sm transition-all"
                                type="button"
                            >
                                {downloadingReport ? 'İndiriliyor…' : 'Rapor İndir'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Participants Panel */}
                {showParticipants && (
                    <div className="relative z-10 bg-[#11223D]/40 backdrop-blur-xl px-6 py-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">👥 Katılımcılar</span>
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    {participantCount}
                                </span>
                                {isInitialParticipantsLoading && (
                                    <span className="inline-flex items-center" aria-label="Yükleniyor">
                                        <span className="sr-only">Yükleniyor…</span>
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                    </span>
                                )}
                            </div>
                        </div>
                        {participantsError ? (
                            <div className="text-sm text-red-400 font-semibold">
                                Katılımcılar yüklenemedi.
                            </div>
                        ) : participants.length === 0 ? (
                            <div className="text-sm text-gray-400">
                                Henüz katılımcı yok.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                                {participants.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="group flex items-center gap-2 bg-white/5 rounded-xl p-2.5 border border-white/10 hover:border-indigo-400/30 transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                            {displayInitial(p.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {displayName(p.name)}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {p.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={async (ev) => {
                                                ev.preventDefault();
                                                ev.stopPropagation();

                                                const ok = confirm(`“${displayName(p.name)}” kullanıcısının oturumunu sonlandırmak istiyor musunuz?`);
                                                if (!ok) return;

                                                kickParticipantMutation.mutate({
                                                    eventId,
                                                    participantId: p.id,
                                                });
                                            }}
                                            title="Oturumu Sonlandır"
                                            className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Questions Panel */}
                <div className="relative z-10 flex-1 bg-[#11223D]/40 backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#11223D]/30">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-white">💬 Gelen Sorular</span>
                            <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-bold border border-amber-500/30">
                                {pendingQuestions.length} Bekleyen
                            </span>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div
                        ref={questionsListRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {allQuestions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-16">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare size={48} className="text-gray-600" />
                                </div>
                                <p className="text-2xl font-black text-gray-500 mb-2">Henüz soru gelmedi</p>
                                <p className="text-gray-500">Katılımcılar soru gönderdiğinde burada görünecek.</p>
                            </div>
                        ) : (
                            allQuestions
                                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((q: any) => {
                                    const isShown = currentShownQuestionId === q.id;
                                    const status = q.status || 'pending';

                                    return (
                                        <div
                                            key={q.id}
                                            className={`relative border-2 rounded-2xl p-5 transition-all hover:shadow-xl ${isShown
                                                ? 'border-purple-400 bg-purple-500/10 ring-4 ring-purple-500/20'
                                                : status === 'approved'
                                                    ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                                                    : status === 'rejected'
                                                        ? 'border-red-500/20 bg-red-500/5 opacity-60 hover:opacity-100'
                                                        : 'border-amber-500/30 bg-white/5 hover:border-indigo-400/40'
                                                }`}
                                        >
                                            {/* Shown Badge */}
                                            {isShown && (
                                                <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                                                    📺 Ekranda Gösteriliyor
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                        {displayInitial(q.participantName)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white">
                                                            {displayName(q.participantName)}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Clock size={12} />
                                                            {getTimeAgo(q.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${status === 'approved'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : status === 'rejected'
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    }`}>
                                                    {status === 'approved' ? 'Onaylı' : status === 'rejected' ? 'Gizli' : 'Beklemede'}
                                                </span>
                                            </div>

                                            {/* Question Text */}
                                            <p className={`text-lg leading-relaxed mb-4 ${status === 'rejected' ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                                                {q.questionText}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Approve Button */}
                                                <button
                                                    onClick={() => updateStatus.mutate({ id: q.id, status: 'approved' })}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${status === 'approved'
                                                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                                                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                                                        }`}
                                                >
                                                    <Check size={16} />
                                                    ✔ Onayla
                                                </button>

                                                {/* Hide/Reject Button */}
                                                <button
                                                    onClick={() => updateStatus.mutate({ id: q.id, status: 'rejected' })}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${status === 'rejected'
                                                        ? 'bg-orange-600 text-white'
                                                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                                                        }`}
                                                >
                                                    <EyeOff size={16} />
                                                    🙈 Gizle
                                                </button>

                                                {/* Show on Screen Button (only for approved) */}
                                                {status === 'approved' && (
                                                    isShown ? (
                                                        <button
                                                            onClick={handleCloseFullScreen}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/25"
                                                        >
                                                            <X size={16} />
                                                            ❌ Kapat
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleShowOnScreen(q.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/25"
                                                        >
                                                            <Monitor size={16} />
                                                            ⭐ Öne Çıkan Soru
                                                        </button>
                                                    )
                                                )}

                                                {/* Undo Button (for rejected) */}
                                                {status === 'rejected' && (
                                                    <button
                                                        onClick={() => updateStatus.mutate({ id: q.id, status: 'pending' })}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-bold text-sm transition-all"
                                                    >
                                                        <Undo2 size={16} />
                                                        ↺ Geri Al
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/25 ml-auto"
                                                >
                                                    <Trash2 size={16} />
                                                    🗑️ Sil
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>

            {showTabletQr && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setShowTabletQr(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div>
                                <div className="text-lg font-extrabold text-gray-900">Tablet Ekranı</div>
                                <div className="text-xs text-gray-500">QR kodu taratıp hızlıca açabilirsiniz</div>
                            </div>
                            <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-gray-100"
                                onClick={() => setShowTabletQr(false)}
                                aria-label="Kapat"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5">
                            {tabletTokenError && (
                                <div className="mb-4 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                    {tabletTokenError}
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                    {tabletTokenLoading && !tabletQrCodeUrl ? (
                                        <div className="w-[240px] h-[240px] flex items-center justify-center text-sm text-gray-600">
                                            Token hazırlanıyor…
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={tabletQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(buildTabletBaseUrl())}`}
                                            alt="Tablet QR"
                                            className="w-[240px] h-[240px] mix-blend-multiply"
                                        />
                                    )}
                                </div>

                                <div className="w-full">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                        Tablet Link
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={tabletUrl || buildTabletBaseUrl()}
                                            readOnly
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800"
                                            onClick={() => navigator.clipboard.writeText(tabletUrl || buildTabletBaseUrl())}
                                            title="Kopyala"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-5 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-bold hover:bg-gray-50"
                                onClick={ensureTabletUrl}
                                disabled={tabletTokenLoading}
                            >
                                {tabletTokenLoading ? 'Yenileniyor…' : 'Token Yenile'}
                            </button>
                            <button
                                type="button"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-500 hover:to-purple-500"
                                onClick={openTabletInNewTab}
                            >
                                <span className="inline-flex items-center justify-center gap-2">
                                    Aç
                                    <ExternalLink size={16} />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
