"use client";

import { trpc } from "@/utils/trpc";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MessageSquare, Users, Quote, UserCheck, PowerOff } from "lucide-react";

const DEFAULT_CF_STREAM_HOST = 'customer-bl0til6mmugr9zxr.cloudflarestream.com';

const DEFAULT_OPENING_BACKGROUND_URL =
    process.env.NEXT_PUBLIC_OPENING_THEME_BACKGROUND_URL ||
    'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/5f3d3fad-f750-4962-9122-4aa2c377aa00/soruyorum';

const DEFAULT_OPENING_VIDEO_URL =
    process.env.NEXT_PUBLIC_OPENING_THEME_VIDEO_URL ||
    // Poster-backed iframe is more robust in nested iframes (shows thumbnail even if autoplay is blocked).
    `https://${DEFAULT_CF_STREAM_HOST}/045897b49be6652b1570cfe649bebbbd/iframe?loop=true&autoplay=true&muted=true&controls=false&poster=${encodeURIComponent(
        `https://${DEFAULT_CF_STREAM_HOST}/045897b49be6652b1570cfe649bebbbd/thumbnails/thumbnail.jpg?time=&height=600`
    )}`;

const toCloudflareStreamEmbedUrl = (inputUrlOrId: string, opts?: { loop?: boolean; controls?: boolean }) => {
    const trimmed = (inputUrlOrId || '').trim();
    if (!trimmed) return '';

    const idMatch = trimmed.match(/[a-f0-9]{32}/i);
    if (!idMatch) return '';
    const videoId = idMatch[0];

    // If the user already provided an iframe URL, keep its host but normalize query params.
    let url: URL;
    try {
        if (/\/iframe(\?|$)/i.test(trimmed) && /^https?:\/\//i.test(trimmed)) {
            url = new URL(trimmed);
        } else {
            // Default: build a customer-domain iframe URL from either /watch, /iframe, or raw ID.
            const hostMatch = trimmed.match(/^https?:\/\/([^/]+)/i);
            const host = hostMatch?.[1] || DEFAULT_CF_STREAM_HOST;
            url = new URL(`https://${host}/${videoId}/iframe`);
        }
    } catch {
        return '';
    }

    const loop = opts?.loop !== false;
    const controls = opts?.controls === true;
    url.searchParams.set('autoplay', 'true');
    url.searchParams.set('muted', 'true');
    url.searchParams.set('loop', loop ? 'true' : 'false');
    url.searchParams.set('controls', controls ? 'true' : 'false');

    // Ensure we have a poster so the background isn't blank if autoplay is blocked.
    if (!url.searchParams.get('poster')) {
        url.searchParams.set(
            'poster',
            `https://${url.host}/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`
        );
    }

    return url.toString();
};

export default function LiveQandaPage() {
    const params = useParams();
    const eventId = params.id as string;
    const searchParams = useSearchParams();
    const isEmbed = useMemo(() => (searchParams?.get('embed') || '') === '1', [searchParams]);
    const previewTitleParam = useMemo(() => {
        if (!isEmbed) return '';
        return String(searchParams?.get('pt') || '');
    }, [isEmbed, searchParams]);
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

    // When embedded in an iframe (editor preview), prevent scrollbars.
    useEffect(() => {
        if (!isEmbed) return;

        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        const prevBodyMargin = document.body.style.margin;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
            document.body.style.margin = prevBodyMargin;
        };
    }, [isEmbed]);

    // Fetch event data for PIN and QR
    const { data: eventData } = trpc.events.getPublicInfo.useQuery(
        { id: eventId },
        // Faster polling so "Öne Çıkan Soru" feels instant without websockets.
        { enabled: !!eventId, refetchInterval: 1000 }
    );

    const rawThemeSettings = (eventData as any)?.theme ?? (eventData as any)?.settings?.theme;
    const themeSettings = rawThemeSettings && typeof rawThemeSettings === 'object' ? rawThemeSettings : {};
    const hasThemeBackground = Boolean(themeSettings?.backgroundImage || themeSettings?.background || themeSettings?.backgroundColor);

    const openingBackgroundSetting = (themeSettings as any)?.openingBackgroundUrl;
    const openingBackgroundRaw =
        openingBackgroundSetting === undefined || openingBackgroundSetting === null
            ? DEFAULT_OPENING_BACKGROUND_URL
            : String(openingBackgroundSetting);
    const openingBackgroundUrl = (openingBackgroundRaw || '').trim();

    // Backwards compat: allow an explicit openingVideoUrl to override the backdrop.
    // We no longer default to a video (default is the opening background image).
    const openingVideoSetting = (themeSettings as any)?.openingVideoUrl;
    const openingVideoTrimmed = openingVideoSetting === undefined || openingVideoSetting === null
        ? ''
        : String(openingVideoSetting).trim();
    const openingVideoEmbedUrl = openingVideoTrimmed
        ? toCloudflareStreamEmbedUrl(openingVideoTrimmed, { loop: true, controls: false })
        : '';

    const hasOpeningBackdrop = Boolean(openingBackgroundUrl) || Boolean(openingVideoEmbedUrl);
    const openingBackdropLayer = hasOpeningBackdrop ? (
        <div className="absolute inset-0 z-0">
            {openingVideoEmbedUrl ? (
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={openingVideoEmbedUrl}
                    title="Açılış videosu"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    loading="eager"
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${openingBackgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            )}
            <div className="absolute inset-0 bg-black/55" />
        </div>
    ) : null;

    const DEFAULT_PRESENTATION_TITLE = 'Soru Yorum';
    const hasPresentationTitle = Object.prototype.hasOwnProperty.call(themeSettings as any, 'presentationTitle');
    const presentationTitle = hasPresentationTitle
        ? String((themeSettings as any)?.presentationTitle ?? '')
        : DEFAULT_PRESENTATION_TITLE;

    const effectivePresentationTitle = String(previewTitleParam || presentationTitle || '').trim() || DEFAULT_PRESENTATION_TITLE;

    // Duvar başlığı tüm etkinliklerde sabit olsun.
    const wallHeadingTitle = effectivePresentationTitle;
    const wallHeadingSubtitle = String((themeSettings as any)?.wallSubtitle || 'Yeni sorular otomatik eklenir.');
    const rotateHeadingTitle = effectivePresentationTitle;
    const rotateHeadingSubtitle = String((themeSettings as any)?.rotateSubtitle || 'Sorular sırayla gösterilir.');

    const presentationDescription = String((themeSettings as any)?.presentationDescription || '').trim();

    const showInstructions = (themeSettings as any)?.showInstructions !== false;
    const showQR = (themeSettings as any)?.showQR !== false;
    const showStats = (themeSettings as any)?.showStats !== false;
    const showNames = (themeSettings as any)?.showNames !== false;
    const bgAnimationEnabled = Boolean((themeSettings as any)?.bgAnimation);

    const qrPos = (themeSettings as any)?.qrPos as { x: number; y: number } | undefined;
    const qrAbsoluteStyle: React.CSSProperties | undefined = qrPos && typeof qrPos.x === 'number' && typeof qrPos.y === 'number'
        ? { left: `${qrPos.x}px`, bottom: `${qrPos.y}px`, right: 'auto' }
        : undefined;

    const fontFamily = useMemo(() => {
        const ff = (themeSettings as any)?.fontFamily as string | undefined;
        if (!ff) return undefined;
        const trimmed = ff.trim();
        if (!trimmed) return undefined;

        const FONT_MAP: Record<string, string> = {
            Inter: "'Inter', sans-serif",
            Montserrat: "'Montserrat', sans-serif",
            Poppins: "'Poppins', sans-serif",
            Roboto: "'Roboto', sans-serif",
            'Open Sans': "'Open Sans', sans-serif",
            'OpenSans': "'Open Sans', sans-serif",
            Lato: "'Lato', sans-serif",
            Nunito: "'Nunito', sans-serif",
            Raleway: "'Raleway', sans-serif",
            'Playfair Display': "'Playfair Display', serif",
            Georgia: "Georgia, serif",
        };

        if (FONT_MAP[trimmed]) return FONT_MAP[trimmed];
        // If it's already a CSS font-family string, use it.
        if (trimmed.includes(',') || trimmed.includes('sans') || trimmed.includes('serif')) return trimmed;
        return `'${trimmed}', sans-serif`;
    }, [themeSettings]);

    const leftLogo = (themeSettings as any)?.logo as
        | { url?: string | null; x?: number; y?: number; size?: number }
        | undefined;
    const rightLogo = (themeSettings as any)?.rightLogo as
        | { url?: string | null; x?: number; y?: number; size?: number; anchor?: 'top-right' | 'bottom-right' }
        | undefined;

    const leftLogoUrl = (leftLogo?.url as string | null | undefined) || (themeSettings as any)?.logoUrl;
    const leftLogoStyle: React.CSSProperties | undefined = leftLogoUrl
        ? {
            width: `${typeof leftLogo?.size === 'number' ? leftLogo.size : 150}px`,
            top: '72px',
            left: '24px',
            transform: `translate(${typeof leftLogo?.x === 'number' ? leftLogo.x : 0}px, ${typeof leftLogo?.y === 'number' ? leftLogo.y : 0}px)`,
        }
        : undefined;

    const rightLogoUrl = (rightLogo?.url as string | null | undefined) || (themeSettings as any)?.rightLogoUrl;
    const rightLogoStyle: React.CSSProperties | undefined = rightLogoUrl
        ? {
            width: `${typeof rightLogo?.size === 'number' ? rightLogo.size : 150}px`,
            right: '24px',
            [rightLogo?.anchor === 'bottom-right' ? 'bottom' : 'top']: '72px',
            transform: `translate(${typeof rightLogo?.x === 'number' ? rightLogo.x : 0}px, ${typeof rightLogo?.y === 'number' ? rightLogo.y : 0}px)`,
        }
        : undefined;

    const parseToRgb = (color: string): { r: number; g: number; b: number } | null => {
        const raw = (color || '').trim();
        if (!raw) return null;

        if (raw.startsWith('#')) {
            const clean = raw.slice(1);
            if (clean.length === 3) {
                const r = parseInt(clean[0] + clean[0], 16);
                const g = parseInt(clean[1] + clean[1], 16);
                const b = parseInt(clean[2] + clean[2], 16);
                if ([r, g, b].some((n) => Number.isNaN(n))) return null;
                return { r, g, b };
            }
            if (clean.length === 6) {
                const r = parseInt(clean.slice(0, 2), 16);
                const g = parseInt(clean.slice(2, 4), 16);
                const b = parseInt(clean.slice(4, 6), 16);
                if ([r, g, b].some((n) => Number.isNaN(n))) return null;
                return { r, g, b };
            }
            return null;
        }

        const rgbMatch = raw.match(/rgba?\(([^)]+)\)/i);
        if (rgbMatch?.[1]) {
            const parts = rgbMatch[1].split(',').map((p) => p.trim());
            const r = Number(parts[0]);
            const g = Number(parts[1]);
            const b = Number(parts[2]);
            if ([r, g, b].some((n) => Number.isNaN(n))) return null;
            return { r, g, b };
        }

        return null;
    };

    const toRgba = (color: string, alpha: number, fallback: string) => {
        const rgb = parseToRgb(color);
        if (!rgb) return fallback;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    };

    // Renk paleti ayarlarından yazı renklerini belirle (fallback)
    // Varsayılan: "acik" => beyaz yazı. (Kullanıcı özellikle koyu yazı istiyorsa "koyu" seçer.)
    const colorPalette = themeSettings?.colorPalette || 'acik';
    const isDarkText = colorPalette === 'koyu';

    // If an explicit textColor is provided, prefer it.
    // Otherwise default to white for better readability on most backgrounds.
    const explicitTextColor = (themeSettings as any)?.textColor as string | undefined;
    const baseTextColor = explicitTextColor || '#ffffff';

    const textColor = baseTextColor;
    const textColorSecondary = explicitTextColor
        ? toRgba(baseTextColor, 0.75, isDarkText ? '#4b5563' : 'rgba(255,255,255,0.7)')
        : 'rgba(255,255,255,0.7)';
    const textColorMuted = explicitTextColor
        ? toRgba(baseTextColor, 0.55, isDarkText ? '#6b7280' : 'rgba(255,255,255,0.5)')
        : 'rgba(255,255,255,0.5)';
    
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

    const baseStyle = useMemo<React.CSSProperties | undefined>(() => {
        if (!fontFamily) return themeBackgroundStyle;
        return { ...(themeBackgroundStyle || {}), fontFamily };
    }, [themeBackgroundStyle, fontFamily]);

    const qandaStopped = Boolean((eventData as any)?.qandaStopped);

    // Preview override (for editor iframe): ?view=join|wall|rotate
    const forcedView = useMemo<"join" | "wall" | "rotate" | null>(() => {
        const v = (searchParams?.get('view') || '').toLowerCase();
        if (v === 'join' || v === 'wall' || v === 'rotate') return v;
        return null;
    }, [searchParams]);

    const screenMode = ((eventData as any)?.screenMode as string | undefined) || 'wall';
    const effectiveScreenMode: 'wall' | 'rotate' = forcedView === 'rotate'
        ? 'rotate'
        : forcedView === 'wall'
            ? 'wall'
            : (screenMode === 'rotate' ? 'rotate' : 'wall');

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

    const questionsList = useMemo<any[]>(() => {
        return Array.isArray(questions) ? (questions as any[]) : [];
    }, [questions]);

    const demoQuestions = useMemo<any[]>(() => {
        const now = Date.now();
        return [
            { id: 'demo-1', questionText: 'Bu bir örnek sorudur. Duvar görünümü böyle olacak.', participantName: 'Ayşe', createdAt: new Date(now - 1000 * 60).toISOString() },
            { id: 'demo-2', questionText: 'Tek tek modunda sorular bu şekilde sırayla döner.', participantName: 'Mehmet', createdAt: new Date(now - 1000 * 55).toISOString() },
            { id: 'demo-3', questionText: 'Moderatör öne çıkarınca tek bir soru büyük görünür.', participantName: 'Zeynep', createdAt: new Date(now - 1000 * 50).toISOString() },
            { id: 'demo-4', questionText: 'Kısa soru örneği: Hazır mıyız?', participantName: 'Ali', createdAt: new Date(now - 1000 * 45).toISOString() },
            { id: 'demo-5', questionText: 'Uzun örnek: Bu ekranda katılımcı adı ve soru metni görünüyor.', participantName: 'Elif', createdAt: new Date(now - 1000 * 40).toISOString() },
            { id: 'demo-6', questionText: 'Duvar düzeninde kartlar otomatik dizilir.', participantName: 'Can', createdAt: new Date(now - 1000 * 35).toISOString() },
            { id: 'demo-7', questionText: 'Bu da bir başka demo soru.', participantName: 'Deniz', createdAt: new Date(now - 1000 * 30).toISOString() },
            { id: 'demo-8', questionText: 'Sorular geldikçe yeni kartlar eklenir.', participantName: 'Ece', createdAt: new Date(now - 1000 * 25).toISOString() },
        ];
    }, []);

    const renderQuestions = useMemo<any[]>(() => {
        if (isEmbed && forcedView && forcedView !== 'join' && questionsList.length === 0) return demoQuestions;
        return questionsList;
    }, [demoQuestions, forcedView, isEmbed, questionsList]);

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
        if (!renderQuestions || renderQuestions.length === 0) return;

        // Keep index in bounds if list changes.
        setCurrentIndex((prev) => (prev >= renderQuestions.length ? 0 : prev));

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % renderQuestions.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [renderQuestions, featuredQuestion?.id, effectiveScreenMode]);

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

    const shouldShowJoin = forcedView === 'join' || (!forcedView && renderQuestions.length === 0);
    if (shouldShowJoin) {
        return (
            <div className="min-h-screen bg-[#0a051d] flex flex-col overflow-hidden relative" style={{ ...(baseStyle || {}), color: textColor }}>
                {openingBackdropLayer}

                {/* Top Instruction Bar */}
                {showInstructions ? (
                    <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50">
                        <p className="text-lg font-medium" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {!hasOpeningBackdrop && bgAnimationEnabled ? (
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                ) : null}

                {leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : null}

                {rightLogoUrl ? (
                    <img src={rightLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={rightLogoStyle} />
                ) : null}

                {!hasOpeningBackdrop && !hasThemeBackground ? (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                ) : null}

                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <div className="relative z-10 text-center space-y-8 px-10 py-9 rounded-[2.75rem] bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl">
                        <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 animate-pulse">
                            <MessageSquare size={64} className="text-indigo-400" />
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter" style={{ color: textColor }}>
                            {presentationTitle || DEFAULT_PRESENTATION_TITLE}
                        </h1>
                        <p className="text-2xl font-medium" style={{ color: textColorSecondary }}>
                            {presentationDescription || 'Sorularınızı göndermek için QR kodu taratın veya PIN kodunu girin.'}
                        </p>

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
                                <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: textColorMuted }}>KOD</p>
                                <p className="text-6xl font-black tracking-wider" style={{ color: textColor }}>{eventData?.eventPin || '...'}</p>

                                {/* Participant Count */}
                                {showStats ? (
                                    <div className="mt-6 flex items-center gap-3 bg-green-500/20 rounded-xl px-4 py-3 border border-green-500/30">
                                        <UserCheck className="text-green-400" size={28} />
                                        <div>
                                            <p className="text-3xl font-black text-green-400">{eventData?.participantCount || 0}</p>
                                            <p className="text-xs font-bold text-green-300/60 uppercase tracking-widest">Katılımcı</p>
                                        </div>
                                    </div>
                                ) : null}
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
            ? (renderQuestions && renderQuestions.length ? (renderQuestions as any[])[currentIndex] : null)
            : null;

    // Spotlight mode: show only the featured question in a large, centered card
    // until the moderator clears it.
    if (featuredQuestion?.id && currentQuestion) {
        return (
            <div className="min-h-screen bg-[#0a051d] overflow-hidden relative flex flex-col" style={{ ...(baseStyle || {}), color: textColor }}>
                {openingBackdropLayer}
                {/* Background glow + dim */}
                {!hasThemeBackground && !hasOpeningBackdrop ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[140px]"></div>
                        <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                ) : null}

                {/* Top Instruction Bar */}
                {showInstructions ? (
                    <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                        <p className="text-lg font-medium" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {!hasOpeningBackdrop && bgAnimationEnabled ? (
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                ) : null}

                {leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : null}

                {rightLogoUrl ? (
                    <img src={rightLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={rightLogoStyle} />
                ) : null}

                {/* Badge */}
                <div className="absolute top-20 left-10 z-50">
                    <div className="px-5 py-2 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 text-yellow-200 font-black tracking-widest text-xs uppercase drop-shadow-lg">
                        Öne Çıkan Soru
                    </div>
                </div>

                {/* Corner stats */}
                {showStats ? (
                    <div className="absolute top-20 right-10 z-50 flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-green-500/15 rounded-xl px-4 py-3 border border-green-500/25 backdrop-blur-md">
                            <UserCheck className="text-green-400" size={22} />
                            <div className="text-left">
                                <p className="text-2xl font-black text-green-400 leading-none">{eventData?.participantCount || 0}</p>
                                <p className="text-[10px] font-bold text-green-200/50 uppercase tracking-widest">Katılımcı</p>
                            </div>
                        </div>
                        <div className="text-right bg-white/5 rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md">
                            <p className="text-2xl font-black leading-none" style={{ color: textColor }}>{renderQuestions.length}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColorMuted }}>Onaylı</p>
                        </div>
                    </div>
                ) : null}

                {/* Main card */}
                <div className="flex-1 flex items-center justify-center p-10 relative z-10">
                    <div className="w-full max-w-6xl">
                        <div
                            className={
                                "bg-black/40 backdrop-blur-xl border border-white/12 rounded-[4rem] p-16 md:p-20 shadow-2xl " +
                                "transform-gpu transition-transform duration-300 ease-out " +
                                (featuredPulse ? "scale-[1.03]" : "scale-100")
                            }
                        >
                            <p className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-12 italic drop-shadow-lg" style={{ color: textColor }}>
                                “{currentQuestion.questionText}”
                            </p>

                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Users size={40} className="text-white" />
                                </div>
                                <div>
                                    {showNames ? (
                                        <p className="text-3xl md:text-4xl font-black" style={{ color: textColorSecondary }}>
                                            {displayName((currentQuestion as any).participantName)}
                                        </p>
                                    ) : null}
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
                {showQR ? (
                    <div className="absolute z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md" style={qrAbsoluteStyle || { bottom: '40px', right: '40px' }}>
                        <div className="bg-white p-2 rounded-xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: textColorMuted }}>KOD</p>
                            <p className="text-3xl font-black tracking-wider" style={{ color: textColor }}>{eventData?.eventPin || '...'}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    // Rotate mode (one-by-one)
    if (effectiveScreenMode === 'rotate' && currentQuestion) {
        return (
            <div className="min-h-screen bg-[#0a051d] overflow-hidden relative flex flex-col" style={{ ...(baseStyle || {}), color: textColor }}>
                {openingBackdropLayer}

                {!hasThemeBackground && !hasOpeningBackdrop ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                ) : null}

                {showInstructions ? (
                    <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                        <p className="text-lg font-medium" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {!hasOpeningBackdrop && bgAnimationEnabled ? (
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/12 rounded-full blur-[140px] animate-pulse"></div>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                ) : null}

                {leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : null}

                {rightLogoUrl ? (
                    <img src={rightLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={rightLogoStyle} />
                ) : null}

                <div className="relative z-10 px-10 pt-10 pb-6">
                    <div className="flex items-start justify-end">
                        <div className="bg-black/30 backdrop-blur-md rounded-2xl px-6 py-4 text-right">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg" style={{ color: textColor }}>
                                {rotateHeadingTitle}
                            </h1>
                            {rotateHeadingSubtitle.trim() ? (
                                <p className="font-semibold" style={{ color: textColorSecondary }}>
                                    {rotateHeadingSubtitle}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {showStats ? (
                        <div className="mt-4 flex items-center justify-end gap-4">
                            <div className="flex items-center gap-3 bg-green-500/15 rounded-xl px-4 py-3 border border-green-500/25 backdrop-blur-md">
                                <UserCheck className="text-green-400" size={22} />
                                <div className="text-left">
                                    <p className="text-2xl font-black text-green-400 leading-none">{eventData?.participantCount || 0}</p>
                                    <p className="text-[10px] font-bold text-green-200/50 uppercase tracking-widest">Katılımcı</p>
                                </div>
                            </div>
                            <div className="text-right bg-white/5 rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md">
                                <p className="text-2xl font-black leading-none" style={{ color: textColor }}>{(renderQuestions?.length || 0) as any}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColorMuted }}>Onaylı Soru</p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex-1 flex items-center justify-center p-12 relative z-10">
                    <div className="w-full max-w-6xl">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/12 rounded-[4rem] p-16 md:p-20 shadow-2xl">
                            <p className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-12 italic drop-shadow-lg" style={{ color: textColor }}>
                                “{currentQuestion.questionText}”
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Users size={40} className="text-white" />
                                </div>
                                <div>
                                    {showNames ? (
                                        <p className="text-3xl md:text-4xl font-black" style={{ color: textColorSecondary }}>
                                            {displayName((currentQuestion as any).participantName)}
                                        </p>
                                    ) : null}
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

                {showQR ? (
                    <div className="absolute z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md" style={qrAbsoluteStyle || { bottom: '40px', right: '40px' }}>
                        <div className="bg-white p-2 rounded-xl">
                            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: textColorMuted }}>KOD</p>
                            <p className="text-3xl font-black tracking-wider" style={{ color: textColor }}>{eventData?.eventPin || '...'}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }

    // Instagram-wall mode (default when not in spotlight)
    return (
        <div className="min-h-screen bg-[#0a051d] flex flex-col overflow-hidden relative" style={{ ...(baseStyle || {}), color: textColor }}>
            {openingBackdropLayer}
            {/* Top Instruction Bar */}
            {showInstructions ? (
                <div className="w-full bg-[#450a0a] py-3 px-6 text-center z-50 shrink-0">
                    <p className="text-lg font-medium" style={{ color: textColor }}>
                        Şu adrese girip: <span className="font-bold">{joinHostname}</span> | kodu girin:{' '}
                        <span className="font-black text-yellow-400 text-xl">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                    </p>
                </div>
            ) : null}

            {!hasOpeningBackdrop && bgAnimationEnabled ? (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/12 rounded-full blur-[140px] animate-pulse"></div>
                    <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/12 rounded-full blur-[140px] animate-pulse"></div>
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
            ) : null}

            {leftLogoUrl ? (
                <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
            ) : null}

            {rightLogoUrl ? (
                <img src={rightLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={rightLogoStyle} />
            ) : null}

            {/* Background Glow */}
            {!hasThemeBackground && !hasOpeningBackdrop ? (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/18 rounded-full blur-[140px]"></div>
                    <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/18 rounded-full blur-[140px]"></div>
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
            ) : null}

            {/* Header */}
            <div className="relative z-10 px-10 pt-10 pb-6">
                <div className="flex items-end justify-end">
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl px-6 py-4 text-right">
                        <h1 className="text-5xl font-black tracking-tight drop-shadow-lg" style={{ color: textColor }}>
                            {wallHeadingTitle}
                        </h1>
                        {wallHeadingSubtitle.trim() ? (
                            <p className="font-semibold" style={{ color: textColorSecondary }}>
                                {wallHeadingSubtitle}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-4">
                    {showStats ? (
                        <div className="flex items-center gap-3 bg-green-500/15 rounded-xl px-4 py-3 border border-green-500/25 backdrop-blur-md">
                            <UserCheck className="text-green-400" size={22} />
                            <div className="text-left">
                                <p className="text-2xl font-black text-green-400 leading-none">{eventData?.participantCount || 0}</p>
                                <p className="text-[10px] font-bold text-green-200/50 uppercase tracking-widest">Katılımcı</p>
                            </div>
                        </div>
                    ) : null}
                    <div className="text-right bg-white/5 rounded-xl px-4 py-3 border border-white/10 backdrop-blur-md">
                        <p className="text-2xl font-black leading-none" style={{ color: textColor }}>{(renderQuestions?.length || 0) as any}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: textColorMuted }}>Onaylı Soru</p>
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
                        {(wallQuestions.length ? wallQuestions : renderQuestions || []).slice(0, maxWallCards).map((q: any) => {
                            const isNew = Boolean(wallPulseIds[q.id]);
                            return (
                                <div key={q.id}>
                                    <div
                                        className={
                                            "bg-black/40 backdrop-blur-xl border border-white/12 rounded-3xl p-6 shadow-2xl h-[180px] flex flex-col justify-between " +
                                            "transform-gpu transition-transform duration-300 ease-out " +
                                            (isNew ? "scale-[1.02]" : "scale-100")
                                        }
                                        style={isNew ? { animation: "wallPop 700ms ease-out" } : undefined}
                                    >
                                        <p
                                            className="text-[clamp(1.25rem,1.6vw,1.9rem)] font-black leading-snug tracking-tight"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitBoxOrient: "vertical" as any,
                                                WebkitLineClamp: 2,
                                                overflow: "hidden",
                                                color: textColor,
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
                                                    {showNames ? (
                                                        <p className="text-[clamp(1rem,1.05vw,1.25rem)] font-black truncate" style={{ color: textColorSecondary }}>
                                                            {displayName(q.participantName)}
                                                        </p>
                                                    ) : null}
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
            {showQR ? (
                <div className="absolute z-50 flex items-center gap-6 p-4 bg-white/6 rounded-2xl border border-white/12 backdrop-blur-md" style={qrAbsoluteStyle || { bottom: '40px', right: '40px' }}>
                    <div className="bg-white p-2 rounded-xl">
                        <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: textColorMuted }}>KOD</p>
                        <p className="text-3xl font-black tracking-wider" style={{ color: textColor }}>{eventData?.eventPin || '...'}</p>
                    </div>
                </div>
            ) : null}

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
                            <p className="text-4xl font-black text-white">{renderQuestions?.length || 0}</p>
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
                            {(renderQuestions || []).map((_, idx) => (
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
