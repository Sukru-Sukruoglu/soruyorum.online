"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "../../utils/trpc";
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const questionsListRef = useRef<HTMLDivElement>(null);

    const [showTabletQr, setShowTabletQr] = useState(false);
    const [tabletUrl, setTabletUrl] = useState<string>('');
    const [tabletTokenLoading, setTabletTokenLoading] = useState(false);
    const [tabletTokenError, setTabletTokenError] = useState<string | null>(null);

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
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            await fetch(`/api/events/${eventId}/qanda/anonymous`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        return then.toLocaleDateString('tr-TR');
    };

    const getTabletHost = () => {
        const hostname = (window.location.hostname || '').toLowerCase();
        if (hostname.includes('ksinteraktif.com')) return 'https://tablet.ksinteraktif.com';
        return 'https://tablet.soruyorum.online';
    };

    const buildTabletBaseUrl = () => `${getTabletHost()}/events/${eventId}`;

    const ensureTabletUrl = async () => {
        setTabletTokenLoading(true);
        setTabletTokenError(null);

        const baseUrl = buildTabletBaseUrl();

        try {
            const authToken = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            if (!authToken) {
                setTabletUrl(baseUrl);
                setTabletTokenError('Oturum bulunamadı. Tablet ekranında giriş istenebilir.');
                return;
            }

            const res = await fetch(`/api/events/${eventId}/tablet/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
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
                return;
            }

            const data = await res.json();
            const shortToken = String(data?.token || '');
            if (!shortToken) {
                setTabletUrl(baseUrl);
                setTabletTokenError('Tablet token boş döndü. Tablet ekranında giriş istenebilir.');
                return;
            }

            setTabletUrl(`${baseUrl}?t=${encodeURIComponent(shortToken)}`);
        } catch {
            setTabletUrl(baseUrl);
            setTabletTokenError('Tablet token alınamadı. Tablet ekranında giriş istenebilir.');
        } finally {
            setTabletTokenLoading(false);
        }
    };

    const openTabletQrModal = async () => {
        setShowTabletQr(true);
        await ensureTabletUrl();
    };

    const openTabletInNewTab = () => {
        const url = tabletUrl || buildTabletBaseUrl();
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
        <div className="h-[calc(100vh-120px)] flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
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
                            <div className="text-3xl font-black text-indigo-600 tabular-nums">{serverTime}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sunucu Saati</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-gray-900">{allQuestions.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Toplam Soru</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-amber-500">{pendingQuestions.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gelen</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-green-600">{approvedQuestions.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gösteriliyor</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-indigo-600">{participantCount}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Katılımcı</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            isRefreshing 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                        }`}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        🔄 Yenile
                    </button>

                    <button 
                        onClick={toggleAnonymousMode}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            anonymousMode 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🕶️ Anonim: {anonymousMode ? 'Açık' : 'Kapalı'}
                    </button>

                    {showMultiJoinButton && (
                        <button
                            onClick={onMultiJoinClick}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                                multiJoinEnabled
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-gray-200/50'
                            }`}
                            type="button"
                        >
                            ✓ Çoklu Katılım: {multiJoinEnabled ? 'Açık' : 'Kapalı'}
                        </button>
                    )}

                    <button 
                        onClick={() => setShowParticipants(!showParticipants)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            showParticipants 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Users size={16} />
                        👥 Katılımcılar
                    </button>

                    {showPresentationButton && mode !== 'tablet' && (
                        <button 
                            onClick={() => {
                                // Determine the correct screen domain based on current hostname
                                const hostname = window.location.hostname;
                                let screenHost = window.location.origin;
                                if (hostname.includes('soruyorum.online')) {
                                    screenHost = 'https://ekran.soruyorum.online';
                                } else if (hostname.includes('ksinteraktif.com')) {
                                    screenHost = 'https://ekran.ksinteraktif.com';
                                }
                                const url = `${screenHost}/events/${eventId}/live`;
                                const newWindow = window.open(url, 'sunumEkrani', 'fullscreen=yes,menubar=no,toolbar=no,location=no,status=no');
                                if (newWindow) {
                                    // Try to make it fullscreen
                                    newWindow.focus();
                                    setTimeout(() => {
                                        try {
                                            newWindow.document.documentElement.requestFullscreen?.();
                                        } catch (e) {
                                        }
                                    }, 1000);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25"
                        >
                            <Monitor size={16} />
                            📺 Sunum Ekranı
                        </button>
                    )}

                    {showTabletButton && (
                        <button
                            onClick={openTabletQrModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                            type="button"
                        >
                            Tablet Ekranı
                        </button>
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
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-bold text-sm transition-all"
                            type="button"
                        >
                            {downloadingReport ? 'İndiriliyor…' : 'Rapor İndir'}
                        </button>
                    )}
                </div>
            </div>

            {/* Participants Panel */}
            {showParticipants && (
                <div className="bg-white/95 backdrop-blur-xl px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">👥 Katılımcılar</span>
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
                        <div className="text-sm text-red-600 font-semibold">
                            Katılımcılar yüklenemedi.
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            Henüz katılımcı yok.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                            {participants.map((p: any) => (
                                <div 
                                    key={p.id} 
                                    className="group flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 border border-gray-100 hover:border-indigo-200 transition-all"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                        {displayInitial(p.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {displayName(p.name)}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <span className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                            <span className="text-[10px] text-gray-500 font-medium">
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
                                        className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 flex items-center justify-center"
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
            <div className="flex-1 bg-white/95 backdrop-blur-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-gray-900">💬 Gelen Sorular</span>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-200">
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
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare size={48} className="text-gray-300" />
                            </div>
                            <p className="text-2xl font-black text-gray-400 mb-2">Henüz soru gelmedi</p>
                            <p className="text-gray-400">Katılımcılar soru gönderdiğinde burada görünecek.</p>
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
                                        className={`relative bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-xl ${
                                            isShown 
                                                ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-100' 
                                                : status === 'approved'
                                                    ? 'border-green-200 bg-green-50/50 hover:border-green-300'
                                                    : status === 'rejected'
                                                        ? 'border-red-200 bg-red-50/30 opacity-60 hover:opacity-100'
                                                        : 'border-amber-200 hover:border-indigo-300'
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
                                                    <span className="font-bold text-gray-900">
                                                        {displayName(q.participantName)}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <Clock size={12} />
                                                        {getTimeAgo(q.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                                status === 'approved' 
                                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                                    : status === 'rejected'
                                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                                {status === 'approved' ? 'Onaylı' : status === 'rejected' ? 'Gizli' : 'Beklemede'}
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        <p className={`text-lg leading-relaxed mb-4 ${status === 'rejected' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                            {q.questionText}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Approve Button */}
                                            <button
                                                onClick={() => updateStatus.mutate({ id: q.id, status: 'approved' })}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                    status === 'approved'
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
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                                    status === 'rejected'
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
