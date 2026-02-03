"use client";

import { trpc } from "@/utils/trpc";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Users, Quote, UserCheck, PowerOff } from "lucide-react";

export default function LiveQandaPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [anonymousModeFallback, setAnonymousModeFallback] = useState(false);
    const [featuredPulse, setFeaturedPulse] = useState(false);
    const [wallPulseIds, setWallPulseIds] = useState<Record<string, boolean>>({});
    const wallPulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fallback only: if server flag is unavailable, use localStorage.
    useEffect(() => {
        const checkAnonymousMode = () => {
            const stored = localStorage.getItem(`anonymous_mode_${eventId}`);
            setAnonymousModeFallback(stored === '1');
        };
        checkAnonymousMode();

        // Listen for storage changes (cross-tab sync)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === `anonymous_mode_${eventId}`) {
                setAnonymousModeFallback(e.newValue === '1');
            }
        };
        window.addEventListener('storage', handleStorage);

        // Poll periodically as backup
        const interval = setInterval(checkAnonymousMode, 2000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [eventId]);

    // Fetch event data for PIN and QR
    const { data: eventData } = trpc.events.getPublicInfo.useQuery(
        { id: eventId },
        // Faster polling so "Öne Çıkan Soru" feels instant without websockets.
        { enabled: !!eventId, refetchInterval: 1000 }
    );

    const themeSettings = (eventData as any)?.theme ?? (eventData as any)?.settings?.theme;
    const hasThemeBackground = Boolean(themeSettings?.backgroundImage || themeSettings?.background || themeSettings?.backgroundColor);
    const themeBackgroundStyle = useMemo<React.CSSProperties | undefined>(() => {
        if (!hasThemeBackground) return undefined;

        // Background image (from theme categories with images)
        if (themeSettings?.backgroundImage) {
            return {
                backgroundImage: `url(${themeSettings.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            };
        }

        // Background from theme (could be image path like /images/themes/...)
        if (themeSettings?.background) {
            // Check if it's an image path
            if (themeSettings.background.startsWith('/') || themeSettings.background.startsWith('http')) {
                return {
                    backgroundImage: `url(${themeSettings.background})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                };
            }
            return { background: themeSettings.background };
        }

        // Solid background color (from theme categories with solid colors)
        if (themeSettings?.backgroundColor) {
            // Check if it's an image path
            if (themeSettings.backgroundColor.startsWith('/') || themeSettings.backgroundColor.startsWith('http')) {
                return {
                    backgroundImage: `url(${themeSettings.backgroundColor})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                };
            }
            return { backgroundColor: themeSettings.backgroundColor };
        }

        return undefined;
    }, [hasThemeBackground, themeSettings?.background, themeSettings?.backgroundImage, themeSettings?.backgroundColor]);

    const qandaStopped = Boolean((eventData as any)?.qandaStopped);

    const screenMode = ((eventData as any)?.screenMode as string | undefined) || 'wall';
    const effectiveScreenMode: 'wall' | 'rotate' = screenMode === 'rotate' ? 'rotate' : 'wall';

    const effectiveAnonymousMode = (eventData as any)?.anonymousMode ?? anonymousModeFallback;

    // Anonymize name helper
    const displayName = (name: string | null | undefined) => {
        if (!effectiveAnonymousMode) return name || 'Anonim';
        if (!name || name === 'Anonim') return 'Anonim';
        const trimmed = name.trim();
        if (!trimmed) return 'Anonim';
        const firstChar = Array.from(trimmed)[0] || 'A';
        const upper = firstChar.toLocaleUpperCase('tr-TR');
        return `${upper}***`;
    };

    // Extract hostname from joinUrl.
    // IMPORTANT: Avoid SSR/CSR branching (e.g. window.location) here to prevent hydration mismatches.
    const joinHostname = useMemo(() => {
        const variant = (process.env.NEXT_PUBLIC_SITE_VARIANT || '').toLowerCase();
        if (variant === 'soruyorum') return 'mobil.soruyorum.online';
        if (variant === 'ksinteraktif') return 'mobil.ksinteraktif.com';

        const fallback = 'mobil.soruyorum.online';
        const joinUrl = eventData?.joinUrl;
        if (!joinUrl) return fallback;

        try {
            const url = new URL(joinUrl);
            const host = url.hostname || fallback;

            // If the event stored joinUrl points to a different tenant/brand, do not leak it.
            // Prefer soruyorum for the soruyorum screen deployment.
            if (host.endsWith('ksinteraktif.com')) return fallback;

            return host;
        } catch {
            return fallback;
        }
    }, [eventData?.joinUrl]);

    const canonicalJoinUrl = useMemo(() => {
        const pin = (eventData as any)?.eventPin || '';
        if (!pin) return `https://${joinHostname}`;
        return `https://${joinHostname}/join?pin=${encodeURIComponent(pin)}`;
    }, [joinHostname, (eventData as any)?.eventPin]);

    // Always encode the canonical join URL to avoid leaking the wrong tenant/brand
    // (some older events may still have qrCodeUrl generated from a stale joinUrl).
    const qrCodeUrl = useMemo(() => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(canonicalJoinUrl)}`;
    }, [canonicalJoinUrl]);

    // Use public endpoint - no auth required
    // Faster polling so newly approved questions appear quickly without websockets.
    const { data: questions } = trpc.qanda.getPublicQuestions.useQuery(
        { eventId },
        { refetchInterval: 1500 }
    );

    const [wallQuestions, setWallQuestions] = useState<Array<any>>([]);
    const wallAreaRef = useRef<HTMLDivElement | null>(null);
    const [wallCols, setWallCols] = useState(3);
    const [maxWallCards, setMaxWallCards] = useState(12);

    useEffect(() => {
        const el = wallAreaRef.current;
        if (!el) return;

        const CARD_MIN_W = 360; // px
        const CARD_H = 180; // px (fixed card height below)
        const GAP = 24; // px (gap-6)

        const compute = () => {
            const rect = el.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            if (!width || !height) return;

            const cols = Math.max(1, Math.floor((width + GAP) / (CARD_MIN_W + GAP)));
            const rows = Math.max(1, Math.floor((height + GAP) / (CARD_H + GAP)));

            setWallCols(cols);
            setMaxWallCards(Math.max(1, cols * rows));
        };

        compute();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => compute());
            ro.observe(el);
        }
        window.addEventListener('resize', compute);

        return () => {
            window.removeEventListener('resize', compute);
            if (ro) ro.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!questions) return;

        setWallQuestions((prev) => {
            const prevIds = new Set(prev.map((q) => q.id));
            const next = Array.from((questions as any[]) || []).sort((a: any, b: any) => {
                const at = new Date(a.createdAt).getTime();
                const bt = new Date(b.createdAt).getTime();
                return bt - at;
            });

            // Keep only the latest N to avoid infinite growth
            const limited = next.slice(0, 40);

            // Mark newly arrived questions for a pop animation
            const newOnes = limited.filter((q: any) => !prevIds.has(q.id));
            if (newOnes.length) {
                setWallPulseIds((cur) => {
                    const updated = { ...cur };
                    for (const q of newOnes) updated[q.id] = true;
                    return updated;
                });

                for (const q of newOnes) {
                    const existingTimer = wallPulseTimersRef.current[q.id];
                    if (existingTimer) clearTimeout(existingTimer);
                    wallPulseTimersRef.current[q.id] = setTimeout(() => {
                        setWallPulseIds((cur) => {
                            const updated = { ...cur };
                            delete updated[q.id];
                            return updated;
                        });
                        delete wallPulseTimersRef.current[q.id];
                    }, 700);
                }
            }

            return limited;
        });
    }, [questions]);

    useEffect(() => {
        return () => {
            for (const t of Object.values(wallPulseTimersRef.current)) clearTimeout(t);
            wallPulseTimersRef.current = {};
        };
    }, []);

    const featuredQuestion = (eventData as any)?.featuredQuestion as
        | {
            id: string;
            participantName?: string | null;
            questionText: string;
        }
        | null
        | undefined;

    useEffect(() => {
        if (!featuredQuestion?.id) return;
        setFeaturedPulse(true);
        const t = setTimeout(() => setFeaturedPulse(false), 300);
        return () => clearTimeout(t);
    }, [featuredQuestion?.id]);

    useEffect(() => {
        // Rotate mode: show questions one-by-one.
        if (featuredQuestion?.id) return;
        if (effectiveScreenMode !== 'rotate') return;
        if (!questions || questions.length === 0) return;

        // Keep index in bounds if list changes.
        setCurrentIndex((prev) => (prev >= questions.length ? 0 : prev));

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % questions.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [questions, featuredQuestion?.id, effectiveScreenMode]);

    // NOTE: Previously this screen rotated questions one-by-one.
    // Now it shows an "Instagram wall" feed when no featured question is active.

    if (qandaStopped) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <div className="text-center space-y-6">
                    <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <PowerOff size={64} className="text-red-500" />
                    </div>
                    <h1 className="text-5xl font-black">Soru gönderimi bitmiştir</h1>
                    <p className="text-xl text-gray-400">Katılımınız için teşekkür ederiz.</p>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a051d] flex flex-col text-white overflow-hidden relative" style={themeBackgroundStyle}>
                {/* Top Instruction Bar */}
                <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50">
                    <p className="text-white text-lg font-medium">
                        Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin: <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                    </p>
                </div>

                {themeSettings?.logoUrl ? (
                    <img
                        src={themeSettings.logoUrl}
                        alt="Logo"
                        className="absolute z-50 object-contain"
                        style={{ width: '150px', top: '72px', left: '24px' }}
                    />
                ) : null}

                {!hasThemeBackground ? (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                ) : null}

                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <div className="relative z-10 text-center space-y-8 px-10 py-9 rounded-[2.75rem] bg-black/25 backdrop-blur-md border border-white/15 shadow-2xl">
                        <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 animate-pulse">
                            <MessageSquare size={64} className="text-indigo-400" />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter">Soru-Yorum Oturumu</h1>
                        <p className="text-2xl text-indigo-200/60 font-medium">Sorularınızı göndermek için QR kodu taratın veya PIN kodunu girin.</p>

                        {/* QR Code and PIN Display */}
                        <div className="flex items-center justify-center gap-8 mt-12">
                            <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/20">
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-indigo-300/50 uppercase tracking-widest mb-2">KOD</p>
                                <p className="text-6xl font-black text-white tracking-wider">{eventData?.eventPin || '...'}</p>

                                {/* Participant Count */}
                                <div className="mt-6 flex items-center gap-3 bg-green-500/20 rounded-xl px-4 py-3 border border-green-500/30">
                                    <UserCheck className="text-green-400" size={28} />
                                    <div>
                                        <p className="text-3xl font-black text-green-400">{eventData?.participantCount || 0}</p>
                                        <p className="text-xs font-bold text-green-300/60 uppercase tracking-widest">Katılımcı</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = featuredQuestion?.id
        ? featuredQuestion
        : effectiveScreenMode === 'rotate'
            ? (questions && questions.length ? (questions as any[])[currentIndex] : null)
            : null;

    // Spotlight mode: show only the featured question in a large, centered card
    // until the moderator clears it.
    if (featuredQuestion?.id && currentQuestion) {
        return (
            <div className="min-h-screen bg-[#0a051d] text-white overflow-hidden relative flex flex-col" style={themeBackgroundStyle}>
                {/* Background glow + dim */}
                {!hasThemeBackground ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[140px]"></div>
                        <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                ) : null}

                {/* Top Instruction Bar */}
                <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                    <p className="text-white text-lg font-medium">
                        Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin: <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                    </p>
                </div>

                {themeSettings?.logoUrl ? (
                    <img
                        src={themeSettings.logoUrl}
                        alt="Logo"
                        className="absolute z-50 object-contain"
                        style={{ width: '150px', top: '72px', left: '24px' }}
                    />
                ) : null}

                {/* Badge */}
                <div className="absolute top-20 left-10 z-50">
                    <div className="px-5 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 font-black tracking-widest text-xs uppercase">
                        Öne Çıkan Soru
                    </div>
                </div>

                {/* Corner stats */}
                <div className="absolute top-20 right-10 z-50 flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-green-500/15 rounded-xl px-4 py-3 border border-green-500/25 backdrop-blur-md">
                        <UserCheck className="text-green-400" size={22} />
                        <div className="text-left">
                            <p className="text-2xl font-black text-green-400 leading-none">{eventData?.participantCount || 0}</p>
                            <p className="text-[10px] font-bold text-green-200/50 uppercase tracking-widest">Katılımcı</p>
                        </div>
                    </div>
                    <div className="text-right bg-white/5 rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md">
                        <p className="text-2xl font-black text-white leading-none">{questions.length}</p>
                        <p className="text-[10px] font-bold text-indigo-200/40 uppercase tracking-widest">Onaylı</p>
                    </div>
                </div>

                {/* Main card */}
                <div className="flex-1 flex items-center justify-center p-10 relative z-10">
                    <div className="w-full max-w-6xl">
                        <div
                            className={
                                "bg-white/6 backdrop-blur-3xl border border-white/12 rounded-[4rem] p-16 md:p-20 shadow-2xl " +
                                "transform-gpu transition-transform duration-300 ease-out " +
                                (featuredPulse ? "scale-[1.03]" : "scale-100")
                            }
                        >
                            <p className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-white mb-12 italic">
                                “{currentQuestion.questionText}”
                            </p>

                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Users size={40} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl md:text-4xl font-black text-indigo-300">
                                        {displayName((currentQuestion as any).participantName)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <img
                                    src="/images/beyazlogouzun.png"
                                    alt="KS İnteraktif"
                                    className="h-8 opacity-90"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="absolute bottom-10 right-10 z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md">
                    <div className="bg-white p-2 rounded-xl">
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-indigo-200/50 uppercase tracking-widest mb-1">KOD</p>
                        <p className="text-3xl font-black text-white tracking-wider">{eventData?.eventPin || '...'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Rotate mode (one-by-one)
    if (effectiveScreenMode === 'rotate' && currentQuestion) {
        return (
            <div className="min-h-screen bg-[#0a051d] text-white overflow-hidden relative flex flex-col" style={themeBackgroundStyle}>
                {!hasThemeBackground ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                ) : null}

                <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                    <p className="text-white text-lg font-medium">
                        Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{" "}
                        <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                    </p>
                </div>

                {themeSettings?.logoUrl ? (
                    <img
                        src={themeSettings.logoUrl}
                        alt="Logo"
                        className="absolute z-50 object-contain"
                        style={{ width: '150px', top: '72px', left: '24px' }}
                    />
                ) : null}

                <div className="flex-1 flex items-center justify-center p-12 relative z-10">
                    <div className="w-full max-w-6xl">
                        <div className="bg-white/6 backdrop-blur-3xl border border-white/12 rounded-[4rem] p-16 md:p-20 shadow-2xl">
                            <p className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-white mb-12 italic">
                                “{currentQuestion.questionText}”
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Users size={40} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-3xl md:text-4xl font-black text-indigo-300">
                                        {displayName((currentQuestion as any).participantName)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <img
                                    src="/images/beyazlogouzun.png"
                                    alt="KS İnteraktif"
                                    className="h-8 opacity-90"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md">
                    <div className="bg-white p-2 rounded-xl">
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-indigo-200/50 uppercase tracking-widest mb-1">KOD</p>
                        <p className="text-3xl font-black text-white tracking-wider">{eventData?.eventPin || '...'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Instagram-wall mode (default when not in spotlight)
    return (
        <div className="min-h-screen bg-[#0a051d] flex flex-col text-white overflow-hidden relative" style={themeBackgroundStyle}>
            {/* Top Instruction Bar */}
            <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                <p className="text-white text-lg font-medium">
                    Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{" "}
                    <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || "..."}</span> veya QR kodu taratın
                </p>
            </div>

            {themeSettings?.logoUrl ? (
                <img
                    src={themeSettings.logoUrl}
                    alt="Logo"
                    className="absolute z-50 object-contain"
                    style={{ width: '150px', top: '72px', left: '24px' }}
                />
            ) : null}

            {/* Background Glow */}
            {!hasThemeBackground ? (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/18 rounded-full blur-[140px]"></div>
                    <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/18 rounded-full blur-[140px]"></div>
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
            ) : null}

            {/* Header */}
            <div className="relative z-10 px-10 pt-10 pb-6 flex items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tight">Soru Duvarı</h1>
                    <p className="text-indigo-200/60 font-semibold">Yeni sorular otomatik eklenir.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-green-500/15 rounded-xl px-4 py-3 border border-green-500/25 backdrop-blur-md">
                        <UserCheck className="text-green-400" size={22} />
                        <div className="text-left">
                            <p className="text-2xl font-black text-green-400 leading-none">{eventData?.participantCount || 0}</p>
                            <p className="text-[10px] font-bold text-green-200/50 uppercase tracking-widest">Katılımcı</p>
                        </div>
                    </div>
                    <div className="text-right bg-white/5 rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md">
                        <p className="text-2xl font-black text-white leading-none">{(questions?.length || 0) as any}</p>
                        <p className="text-[10px] font-bold text-indigo-200/40 uppercase tracking-widest">Onaylı Soru</p>
                    </div>
                </div>
            </div>

            {/* Wall */}
            <div className="relative z-10 flex-1 px-10 pb-10 overflow-hidden">
                <div ref={wallAreaRef} className="h-full overflow-hidden">
                    <div
                        className="max-w-[2200px] mx-auto grid gap-6"
                        style={{ gridTemplateColumns: `repeat(${wallCols}, minmax(0, 1fr))` }}
                    >
                        {(wallQuestions.length ? wallQuestions : questions || []).slice(0, maxWallCards).map((q: any) => {
                            const isNew = Boolean(wallPulseIds[q.id]);
                            return (
                                <div key={q.id}>
                                    <div
                                        className={
                                            "bg-white/6 backdrop-blur-2xl border border-white/12 rounded-3xl p-6 shadow-2xl h-[180px] flex flex-col justify-between " +
                                            "transform-gpu transition-transform duration-300 ease-out " +
                                            (isNew ? "scale-[1.02]" : "scale-100")
                                        }
                                        style={isNew ? { animation: "wallPop 700ms ease-out" } : undefined}
                                    >
                                        <p
                                            className="text-[clamp(1.25rem,1.6vw,1.9rem)] font-black leading-snug tracking-tight text-white"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical" as any,
                                                WebkitLineClamp: 2,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {q.questionText}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 overflow-hidden">
                                                    {q.participantAvatar ? (
                                                        <img
                                                            src={`/avatars/${q.participantAvatar}`}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Users size={22} className="text-white" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[clamp(1rem,1.05vw,1.25rem)] font-black text-indigo-300 truncate">
                                                        {displayName(q.participantName)}
                                                    </p>
                                                </div>
                                            </div>
                                            <img
                                                src="/images/beyazlogouzun.png"
                                                alt="KS İnteraktif"
                                                className="h-5 opacity-80 shrink-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="absolute bottom-10 right-10 z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md">
                <div className="bg-white p-2 rounded-xl">
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-indigo-200/50 uppercase tracking-widest mb-1">KOD</p>
                    <p className="text-3xl font-black text-white tracking-wider">{eventData?.eventPin || '...'}</p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes wallPop {
                    0% { transform: scale(0.98); opacity: 0.35; }
                    35% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a051d] text-white overflow-hidden relative flex flex-col">
            {/* Top Instruction Bar */}
            <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                <p className="text-white text-lg font-medium">
                    Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin: <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                </p>
            </div>

            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse animation-delay-2000"></div>
            </div>

            <div className="container mx-auto flex-1 flex flex-col p-12 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <MessageSquare className="text-indigo-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">SORU & YORUM</h2>
                            <p className="text-indigo-300/60 font-bold uppercase tracking-widest text-sm">Canlı Oturum</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right flex items-center gap-4 bg-green-500/10 rounded-xl px-5 py-3 border border-green-500/20">
                            <UserCheck className="text-green-400" size={28} />
                            <div>
                                <p className="text-3xl font-black text-green-400">{eventData?.participantCount || 0}</p>
                                <p className="text-xs font-bold text-green-300/40 uppercase tracking-widest">Katılımcı</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-white">{questions?.length || 0}</p>
                            <p className="text-xs font-bold text-indigo-300/40 uppercase tracking-widest">Onaylı Soru</p>
                        </div>
                    </div>
                </div>

                {featuredQuestion?.id ? (
                    <div className="mb-8 flex justify-center">
                        <div className="px-5 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 font-black tracking-widest text-xs uppercase">
                            Öne Çıkan Soru
                        </div>
                    </div>
                ) : null}

                {/* Main Content Area */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-5xl">
                        <div key={currentQuestion.id} className="relative animate-in slide-in-from-bottom-12 fade-in duration-1000">
                            <Quote className="absolute -top-16 -left-16 text-indigo-500/10 w-40 h-40 rotate-180" />

                            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-16 shadow-2xl relative z-10">
                                <p className="text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight text-white mb-12 italic">
                                    "{currentQuestion.questionText}"
                                </p>

                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Users size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-indigo-400">{displayName(currentQuestion.participantName)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Progress */}
                <div className="mt-20 flex items-center justify-between">
                    {!featuredQuestion?.id ? (
                        <div className="flex gap-2">
                            {(questions || []).map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 transition-all duration-500 rounded-full ${idx === currentIndex ? "w-12 bg-indigo-500" : "w-3 bg-white/10"
                                        }`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* QR Code and PIN */}
                    <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="bg-white p-2 rounded-xl">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="w-24 h-24"
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-indigo-300/50 uppercase tracking-widest mb-1">KOD</p>
                            <p className="text-3xl font-black text-white tracking-wider">{eventData?.eventPin || '...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
