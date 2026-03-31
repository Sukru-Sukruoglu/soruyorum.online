"use client";

import { trpc } from "@/utils/trpc";
import { isSuperAdminRole, hasFullAccessRole } from "@/utils/auth";
import { fetchPortalAuthSession } from "@/utils/authSession";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MessageSquare, Users, Quote, UserCheck, PowerOff } from "lucide-react";
import { Logo } from "@ks-interaktif/ui";
import { WavyBackground } from "@/components/ui/wavy-background";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { ShapesBackground } from "@/components/ui/shapes-background";
import { PathsBackground } from "@/components/ui/paths-background";
import { VortexBackground } from "@/components/ui/vortex-background";
import { BeamsBackground } from "@/components/ui/beams-background";
import { EtheralShadowBackground } from "@/components/ui/etheral-shadow-background";
import { SmokeBackground } from "@/components/ui/smoke-background";
import { buildGradientFlowGradients, GradientFlowBackground } from "@/components/ui/gradient-flow-background";
import { FallingPatternBackground } from "@/components/ui/falling-pattern-background";
import { GradientDotsBackground } from "@/components/ui/gradient-dots-background";
import { WaveCanvasBackground } from "@/components/ui/wave-canvas-background";
import { MeshShaderBackground } from "@/components/ui/mesh-shader-background";
import { InfiniteGridBackground } from "@/components/ui/infinite-grid-background";
import { WarpShaderBackground } from "@/components/ui/warp-shader-background";
import { SilkBackground } from "@/components/ui/silk-background";
import { ShaderHeroBackground } from "@/components/ui/shader-hero-background";
import { ShaderRingsBackground } from "@/components/ui/shader-rings-background";
import { ParticlePhysicsBackground } from "@/components/ui/particle-physics-background";
import { GlslHillsBackground } from "@/components/ui/glsl-hills-background";
import dynamic from "next/dynamic";

const BackgroundPaperShaders = dynamic(
    () => import("@/components/ui/background-paper-shaders").then((mod) => mod.BackgroundPaperShaders),
    { ssr: false }
);

const EtherealBeamsBackground = dynamic(
  () => import("@/components/ui/ethereal-beams-background").then((mod) => mod.EtherealBeamsBackground),
  { ssr: false }
);

const CanvasRevealEffect = dynamic(
  () => import("@/components/ui/canvas-reveal-effect").then((mod) => mod.CanvasRevealEffect),
  { ssr: false }
);

const DEFAULT_CF_STREAM_HOST = 'customer-bl0til6mmugr9zxr.cloudflarestream.com';
const LIVE_QR_SYNC_KEY = 'soruyorum_live_qr_sync';

const DEFAULT_OPENING_BACKGROUND_URL =
    process.env.NEXT_PUBLIC_OPENING_THEME_BACKGROUND_URL ||
    'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/547991cc-0396-4e5e-754e-b08a20faf800/soruyorum';

const DEFAULT_OPENING_VIDEO_URL =
    process.env.NEXT_PUBLIC_OPENING_THEME_VIDEO_URL ||
    // Poster-backed iframe is more robust in nested iframes (shows thumbnail even if autoplay is blocked).
    `https://${DEFAULT_CF_STREAM_HOST}/045897b49be6652b1570cfe649bebbbd/iframe?loop=true&autoplay=true&muted=true&controls=false&poster=${encodeURIComponent(
        `https://${DEFAULT_CF_STREAM_HOST}/045897b49be6652b1570cfe649bebbbd/thumbnails/thumbnail.jpg?time=&height=600`
    )}`;

const DEFAULT_CENTER_WATERMARK_LOGO_URL =
    'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/d7761f20-fbbf-4235-2afc-5c31cfb53f00/soruyorum';

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
    const hideEditorLogos = useMemo(() => (searchParams?.get('hideEditorLogos') || '') === '1', [searchParams]);
    const previewTitleParam = useMemo(() => {
        if (!isEmbed) return '';
        return String(searchParams?.get('pt') || '');
    }, [isEmbed, searchParams]);
    const previewDescriptionParam = useMemo(() => {
        if (!isEmbed) return '';
        return String(searchParams?.get('pd') || '');
    }, [isEmbed, searchParams]);
    const [embedPreviewTitle, setEmbedPreviewTitle] = useState('');
    const [embedPreviewDescription, setEmbedPreviewDescription] = useState('');
    const embedParentOrigin = useMemo(() => {
        if (typeof document === 'undefined') return '';
        const referrer = document.referrer || '';
        if (!referrer) return window.location.origin;

        try {
            return new URL(referrer).origin;
        } catch {
            return window.location.origin;
        }
    }, []);

    // Seed embed overrides from query params (back-compat) and accept live updates from the parent editor.
    useEffect(() => {
        if (!isEmbed) return;
        setEmbedPreviewTitle(String(previewTitleParam || '').trim());
        setEmbedPreviewDescription(String(previewDescriptionParam || '').trim());
    }, [isEmbed, previewTitleParam, previewDescriptionParam]);

    useEffect(() => {
        if (!isEmbed) return;
        // Ask parent for the latest preview overrides (covers iframe reloads / lost messages).
        try {
            window.parent?.postMessage(
                { type: 'SORUYORUM_PREVIEW_READY' },
                embedParentOrigin || window.location.origin
            );
        } catch {
            // ignore
        }
    }, [embedParentOrigin, isEmbed]);

    useEffect(() => {
        if (!isEmbed) return;

        const handler = (e: MessageEvent) => {
            if (e.origin !== (embedParentOrigin || window.location.origin)) return;

            const data = (e.data || {}) as any;
            if (!data) return;

            if (data.type === 'SORUYORUM_PREVIEW_UPDATE') {
                const payload = (data.payload || data) as any;
                if (typeof payload.pt === 'string') setEmbedPreviewTitle(payload.pt);
                if (typeof payload.pd === 'string') setEmbedPreviewDescription(payload.pd);
                return;
            }

            if (data.type === 'SORUYORUM_PREVIEW_SETTINGS') {
                const payload = (data.payload || data) as any;
                if (typeof payload.showInstructions === 'boolean') setSettingsOverride((p) => ({ ...p, showInstructions: payload.showInstructions }));
                if (typeof payload.showQR === 'boolean') setSettingsOverride((p) => ({ ...p, showQR: payload.showQR }));
                if (typeof payload.showStats === 'boolean') setSettingsOverride((p) => ({ ...p, showStats: payload.showStats }));
                if (typeof payload.showNames === 'boolean') setSettingsOverride((p) => ({ ...p, showNames: payload.showNames }));
                if (typeof payload.bgAnimation === 'boolean') setSettingsOverride((p) => ({ ...p, bgAnimation: payload.bgAnimation }));
                if (typeof payload.bgAnimationType === 'string') setSettingsOverride((p) => ({ ...p, bgAnimationType: payload.bgAnimationType }));
                if (typeof payload.auroraColorPreset === 'string') setSettingsOverride((p) => ({ ...p, auroraColorPreset: payload.auroraColorPreset }));
                if (typeof payload.gradientColorStart === 'string') setSettingsOverride((p) => ({ ...p, gradientColorStart: payload.gradientColorStart }));
                if (typeof payload.gradientColorEnd === 'string') setSettingsOverride((p) => ({ ...p, gradientColorEnd: payload.gradientColorEnd }));
                return;
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [embedParentOrigin, isEmbed]);

    const [anonymousModeFallback, setAnonymousModeFallback] = useState(false);
    const [settingsOverride, setSettingsOverride] = useState<Record<string, boolean | string>>({});
    const [featuredPulse, setFeaturedPulse] = useState(false);
    const [wallPulseIds, setWallPulseIds] = useState<Record<string, boolean>>({});
    const [qrExpanded, setQrExpanded] = useState(false);
    const wallPulseTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const lastQrCommandAtRef = useRef<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentHost, setCurrentHost] = useState("mobil.soruyorum.online");

    useEffect(() => {
        const nextHost = (window.location.host || "").trim().toLowerCase();
        if (nextHost) {
            setCurrentHost(nextHost);
        }
    }, []);

    useEffect(() => {
        lastQrCommandAtRef.current = null;
    }, [eventId]);

    const isDemoMode = useMemo(() => {
        const raw = String(process.env.NEXT_PUBLIC_DEMO_MODE || "").trim().toLowerCase();
        return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
    }, []);

    const [role, setRole] = useState<string | null>(null);
    const [roleReady, setRoleReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        void fetchPortalAuthSession()
            .then((session) => {
                if (!mounted) return;
                setRole(session.role);
            })
            .catch(() => {
                if (mounted) setRole(null);
            })
            .finally(() => {
                if (mounted) setRoleReady(true);
            });
        return () => {
            mounted = false;
        };
    }, []);

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

    // Do not assume platform branding is enabled before event data arrives.
    // Otherwise a full-branding event flashes the default SoruYorum logo on refresh.
    const platformBrandingEnabled = eventData ? (eventData as any)?.platformBranding !== false : false;
    const isWhiteLabelEvent = !platformBrandingEnabled;
    const cardBrandLogoUrl = platformBrandingEnabled ? DEFAULT_CENTER_WATERMARK_LOGO_URL : null;
    const cardBrandLogoAlt = "SoruYorum";

    const showDemoWatermark = useMemo(() => {
        if (!isDemoMode) return false;
        if (!roleReady) return false;
        if (!platformBrandingEnabled) return false;
        return !hasFullAccessRole(role);
    }, [isDemoMode, role, roleReady, platformBrandingEnabled]);

    const demoWatermarkLayer = showDemoWatermark ? (
        <div
            className="fixed inset-0 z-[5] pointer-events-none select-none flex items-center justify-center"
            aria-hidden
        >
            <img
                src={DEFAULT_CENTER_WATERMARK_LOGO_URL}
                alt=""
                className="w-[min(80vw,760px)] h-auto object-contain opacity-30"
            />
        </div>
    ) : null;

    const rawThemeSettings = (eventData as any)?.settings?.theme ?? (eventData as any)?.theme;
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
                    allow="autoplay; fullscreen; picture-in-picture"
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
            <div className="absolute inset-0 bg-black/15" />
        </div>
    ) : null;

    const DEFAULT_PRESENTATION_TITLE = 'Soru Yorum';
    const hasPresentationTitle = Object.prototype.hasOwnProperty.call(themeSettings as any, 'presentationTitle');
    const presentationTitle = hasPresentationTitle
        ? String((themeSettings as any)?.presentationTitle ?? '')
        : DEFAULT_PRESENTATION_TITLE;

    const effectivePresentationTitle = String((embedPreviewTitle || previewTitleParam) || presentationTitle || '').trim() || DEFAULT_PRESENTATION_TITLE;

    // Duvar başlığı tüm etkinliklerde sabit olsun.
    const wallHeadingTitle = effectivePresentationTitle;
    const wallHeadingSubtitle = String((themeSettings as any)?.wallSubtitle || 'Yeni sorular otomatik eklenir.');
    const rotateHeadingTitle = effectivePresentationTitle;
    const rotateHeadingSubtitle = String((themeSettings as any)?.rotateSubtitle || 'Sorular sırayla gösterilir.');

    const presentationDescription = String((themeSettings as any)?.presentationDescription || '').trim();
    const effectivePresentationDescription = String((embedPreviewDescription || previewDescriptionParam) || presentationDescription || '').trim();

    const showInstructions = settingsOverride.showInstructions ?? (themeSettings as any)?.showInstructions !== false;
    const showQR = settingsOverride.showQR ?? (themeSettings as any)?.showQR !== false;
    const showStats = settingsOverride.showStats ?? (themeSettings as any)?.showStats !== false;
    const showNames = settingsOverride.showNames ?? (themeSettings as any)?.showNames !== false;
    const bgAnimationEnabled = 'bgAnimation' in settingsOverride ? Boolean(settingsOverride.bgAnimation) : Boolean((themeSettings as any)?.bgAnimation);
    const bgAnimationType: string = (settingsOverride.bgAnimationType as string) || String((themeSettings as any)?.bgAnimationType || 'gradient');
    const auroraColorPreset: string = (settingsOverride.auroraColorPreset as string) || String((themeSettings as any)?.auroraColorPreset || 'blue');
    const gradientColorStart: string = (settingsOverride.gradientColorStart as string) || String((themeSettings as any)?.gradientColorStart || '#6366f1');
    const gradientColorEnd: string = (settingsOverride.gradientColorEnd as string) || String((themeSettings as any)?.gradientColorEnd || '#8b5cf6');

    const shouldShowOpeningBackdrop = hasOpeningBackdrop && !bgAnimationEnabled;

    const bgAnimationLayer = !shouldShowOpeningBackdrop && bgAnimationEnabled ? (
        bgAnimationType === 'gradient' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <GradientFlowBackground gradients={buildGradientFlowGradients(gradientColorStart, gradientColorEnd)} />
            </div>
        ) : bgAnimationType === 'waves' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <WavyBackground containerClassName="absolute inset-0" backgroundFill="#0a051d" blur={10} speed="fast" waveOpacity={0.5} />
            </div>
        ) : bgAnimationType === 'aurora' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <AuroraBackground className="dark absolute inset-0 bg-transparent" showRadialGradient={false} colorPreset={auroraColorPreset} />
            </div>
        ) : bgAnimationType === 'mesh' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <BackgroundGradientAnimation containerClassName="absolute inset-0" interactive={false} />
            </div>
        ) : bgAnimationType === 'shapes' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <ShapesBackground />
            </div>
        ) : bgAnimationType === 'paths' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <PathsBackground />
            </div>
        ) : bgAnimationType === 'vortex' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <VortexBackground containerClassName="absolute inset-0" backgroundColor="transparent" rangeY={800} particleCount={500} />
            </div>
        ) : bgAnimationType === 'dots' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <CanvasRevealEffect animationSpeed={5} containerClassName="bg-transparent" colors={[[59, 130, 246], [139, 92, 246]]} opacities={[0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 1]} dotSize={2} showGradient={false} />
            </div>
        ) : bgAnimationType === 'beams' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <BeamsBackground />
            </div>
        ) : bgAnimationType === 'shadow' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <EtheralShadowBackground />
            </div>
        ) : bgAnimationType === 'smoke' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <SmokeBackground />
            </div>
        ) : bgAnimationType === 'flow' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <GradientFlowBackground />
            </div>
        ) : bgAnimationType === 'rain' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <FallingPatternBackground />
            </div>
        ) : bgAnimationType === 'gdots' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <GradientDotsBackground />
            </div>
        ) : bgAnimationType === 'wave2' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <WaveCanvasBackground />
            </div>
        ) : bgAnimationType === 'mShader' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <MeshShaderBackground />
            </div>
        ) : bgAnimationType === 'infGrid' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <InfiniteGridBackground />
            </div>
        ) : bgAnimationType === 'warp' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <WarpShaderBackground />
            </div>
        ) : bgAnimationType === 'silk' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <SilkBackground />
            </div>
        ) : bgAnimationType === 'sHero' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <ShaderHeroBackground />
            </div>
        ) : bgAnimationType === 'rings' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <ShaderRingsBackground />
            </div>
        ) : bgAnimationType === 'eBeams' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <EtherealBeamsBackground />
            </div>
        ) : bgAnimationType === 'pPhys' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <ParticlePhysicsBackground />
            </div>
        ) : bgAnimationType === 'hills' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <GlslHillsBackground />
            </div>
        ) : bgAnimationType === 'paper' ? (
            <div className="absolute inset-0 pointer-events-none z-0">
                <BackgroundPaperShaders />
            </div>
        ) : (
            <div className="absolute inset-0 pointer-events-none z-0">
                <GradientFlowBackground gradients={buildGradientFlowGradients(gradientColorStart, gradientColorEnd)} />
            </div>
        )
    ) : null;

    const notifyQrExpanded = (expanded: boolean) => {
        try {
            if (!window.opener || (window.opener as any).closed) return;
            window.opener.postMessage(
                { type: 'SORUYORUM_LIVE_QR_STATE', eventId, expanded },
                '*'
            );
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!showQR) {
            setQrExpanded(false);
            notifyQrExpanded(false);
        }
    }, [showQR]);

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
            if (data.type !== 'SORUYORUM_LIVE_QR_EXPAND') return;
            if (data.eventId && String(data.eventId) !== String(eventId)) return;
            if (!showQR) return;

            const expanded = data.expanded;
            const next = expanded === false ? false : true;
            setQrExpanded(next);
            notifyQrExpanded(next);
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [eventId, showQR]);

    useEffect(() => {
        const applySyncPayload = (payload: any) => {
            if (!payload) return;
            if (payload.eventId && String(payload.eventId) !== String(eventId)) return;
            if (!showQR) return;

            const expanded = payload.expanded;
            const next = expanded === false ? false : true;
            setQrExpanded(next);
            notifyQrExpanded(next);
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key !== LIVE_QR_SYNC_KEY || !e.newValue) return;

            try {
                applySyncPayload(JSON.parse(e.newValue));
            } catch {
                // ignore invalid payloads
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [eventId, showQR]);

    useEffect(() => {
        if (!showQR) return;

        const commandAt = String((eventData as any)?.liveQrCommandAt || '').trim();
        if (!commandAt) return;
        if (lastQrCommandAtRef.current === commandAt) return;

        lastQrCommandAtRef.current = commandAt;
        const next = (eventData as any)?.liveQrExpanded === false ? false : true;
        setQrExpanded(next);
        notifyQrExpanded(next);
    }, [eventData, showQR]);

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
        | { url?: string | null; x?: number; y?: number; size?: number; shadow?: boolean; shadowColor?: string }
        | undefined;
    const rightLogo = (themeSettings as any)?.rightLogo as
        | { url?: string | null; x?: number; y?: number; size?: number; anchor?: 'top-right' | 'bottom-right'; shadow?: boolean; shadowColor?: string }
        | undefined;

    // Logo positions are authored in the editor's 1920×1080 coordinate space.
    // Convert to viewport-relative units so they scale proportionally on any screen.
    const DESIGN_W = 1920;
    const DESIGN_H = 1080;
    const LOGO_BAR_H = 72;

    const leftLogoUrl = (leftLogo?.url as string | null | undefined) || (themeSettings as any)?.logoUrl;
    const lx = typeof leftLogo?.x === 'number' ? leftLogo.x : 0;
    const ly = typeof leftLogo?.y === 'number' ? leftLogo.y : 0;
    const lsize = typeof leftLogo?.size === 'number' ? leftLogo.size : 240;
    const leftShadowColor = leftLogo?.shadowColor || '#ffffff';
    const leftLogoStyle: React.CSSProperties | undefined = leftLogoUrl
        ? {
            left: `${(lx / DESIGN_W) * 100}vw`,
            top: `${((LOGO_BAR_H + ly) / DESIGN_H) * 100}vh`,
            width: `${(lsize / DESIGN_W) * 100}vw`,
            ...(leftLogo?.shadow ? { filter: `drop-shadow(0 0 8px ${leftShadowColor}80) drop-shadow(0 0 20px ${leftShadowColor}40)` } : {}),
        }
        : undefined;

    const rightLogoUrl = (rightLogo?.url as string | null | undefined) || (themeSettings as any)?.rightLogoUrl;
    const rx = typeof rightLogo?.x === 'number' ? rightLogo.x : 0;
    const ry = typeof rightLogo?.y === 'number' ? rightLogo.y : 0;
    const rsize = typeof rightLogo?.size === 'number' ? rightLogo.size : 240;
    const rightLogoStyle: React.CSSProperties | undefined = rightLogoUrl
        ? {
            left: `${((DESIGN_W - rsize + rx) / DESIGN_W) * 100}vw`,
            width: `${(rsize / DESIGN_W) * 100}vw`,
            ...(rightLogo?.anchor === 'bottom-right'
                ? { bottom: `${((LOGO_BAR_H - ry) / DESIGN_H) * 100}vh` }
                : { top: `${((LOGO_BAR_H + ry) / DESIGN_H) * 100}vh` }
            ),
        }
        : undefined;
    const shouldRenderCustomThemeLogos = !(isEmbed && hideEditorLogos);
    const shouldRenderPlatformLogo = shouldRenderCustomThemeLogos && platformBrandingEnabled;

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

    const isWarpBg = bgAnimationType === 'warp';
    const textColor = isWarpBg ? '#111111' : baseTextColor;
    const textColorSecondary = isWarpBg
        ? 'rgba(0,0,0,0.65)'
        : explicitTextColor
            ? toRgba(baseTextColor, 0.75, isDarkText ? 'rgba(0, 0, 0, 1)ff' : 'rgba(255,255,255,0.7)')
            : 'rgba(255,255,255,0.7)';
    const textColorMuted = isWarpBg
        ? 'rgba(0,0,0,0.45)'
        : explicitTextColor
            ? toRgba(baseTextColor, 0.55, isDarkText ? '#000000ff' : 'rgba(255,255,255,0.5)')
            : 'rgba(255,255,255,0.5)';

    const isImageValue = (value: string) => {
        return value.startsWith('/') || value.startsWith('http') || value.startsWith('data:image/');
    };

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
            if (isImageValue(themeSettings.background)) {
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
            if (isImageValue(themeSettings.backgroundColor)) {
                return {
                    backgroundImage: `url(${themeSettings.backgroundColor})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                };
            }
            // Gradient stored in backgroundColor (backwards compat)
            if (themeSettings.backgroundColor.includes('gradient')) {
                return { background: themeSettings.backgroundColor };
            }
            return { backgroundColor: themeSettings.backgroundColor };
        }

        return undefined;
    }, [hasThemeBackground, themeSettings?.background, themeSettings?.backgroundImage, themeSettings?.backgroundColor]);

    const baseStyle = useMemo<React.CSSProperties | undefined>(() => {
        const animationBaseStyle = bgAnimationEnabled
            ? { backgroundColor: '#0a051d' }
            : (themeBackgroundStyle || undefined);

        if (!fontFamily) return animationBaseStyle;
        return { ...(animationBaseStyle || {}), fontFamily };
    }, [bgAnimationEnabled, themeBackgroundStyle, fontFamily]);

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

    const joinHostname = useMemo(() => {
        if (hasFullAccessRole(role)) {
            return 'soruyorum.online';
        }

        const fallback = currentHost || 'mobil.soruyorum.online';

        // Priority 1: backend-provided joinHost (canonical, from organization_domains)
        const backendHost = ((eventData as any)?.joinHost || '').trim().toLowerCase();
        if (backendHost) return backendHost;

        // Priority 2: parse from joinUrl stored on event
        const joinUrl = eventData?.joinUrl;
        if (joinUrl) {
            try {
                const url = new URL(joinUrl);
                const parsed = (url.host || '').trim().toLowerCase();
                if (parsed) return parsed;
            } catch {
                // ignore
            }
        }

        // Priority 3: current browser host (works for direct live page access)
        const current = (currentHost || '').trim().toLowerCase();
        if (current) return current;

        return fallback;
    }, [role, (eventData as any)?.joinHost, eventData?.joinUrl, currentHost]);

    const canonicalJoinUrl = useMemo(() => {
        const pin = (eventData as any)?.eventPin || '';
        const protocol = joinHostname.includes('localhost') || joinHostname.includes('192.168.68.73') ? 'http' : 'https';
        if (!pin) return `${protocol}://${joinHostname}`;
        return `${protocol}://${joinHostname}/join?pin=${encodeURIComponent(pin)}`;
    }, [joinHostname, (eventData as any)?.eventPin]);

    // Always encode the canonical join URL to avoid leaking the wrong tenant/brand
    // (some older events may still have qrCodeUrl generated from a stale joinUrl).
    const qrCodeUrl = useMemo(() => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(canonicalJoinUrl)}`;
    }, [canonicalJoinUrl]);

    const qrExpandedLayer = qrExpanded && showQR ? (
        <div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-8"
            onClick={() => {
                setQrExpanded(false);
                notifyQrExpanded(false);
            }}
            role="button"
            tabIndex={-1}
        >
            <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-10" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
                    <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-[min(78vw,560px)] h-[min(78vw,560px)]"
                    />
                </div>
                <div className="text-center">
                    <p className="text-white/90 text-xl md:text-2xl font-extrabold">
                        Şu adrese girip: <span className="font-black">{joinHostname}</span> | kodu girin:{' '}
                        <span className="font-black text-yellow-300">{eventData?.eventPin || '...'}</span>
                    </p>
                    <p className="mt-2 text-white/70 text-base md:text-lg font-medium">veya QR kodu taratın</p>
                </div>
            </div>
        </div>
    ) : null;

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

        const CARD_MIN_W = 280; // px
        const CARD_H = 125; // px (fixed card height below)
        const GAP = 12; // px (gap-3)

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

    // In embed mode, wait for event data to avoid a flash of unstyled content.
    if (isEmbed && !eventData) {
        return <div className="min-h-screen bg-[#0a051d]" />;
    }

    if (qandaStopped) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                {demoWatermarkLayer}
                {qrExpandedLayer}
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
            <div className="min-h-screen bg-[#0a051d] flex flex-col overflow-hidden relative" style={{ ...(baseStyle || {}), color: textColor, animation: 'viewFadeIn 0.4s ease-out' }}>
                {shouldShowOpeningBackdrop ? openingBackdropLayer : null}
                {demoWatermarkLayer}
                {qrExpandedLayer}

                {/* Top Instruction Bar */}
                {showInstructions ? (
                    <div className="w-full bg-black/75 backdrop-blur-md py-4 px-6 text-center z-50 border-b border-white/15">
                        <p className="text-xl font-bold drop-shadow-md" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-extrabold text-white underline underline-offset-2">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-300 text-2xl tracking-widest drop-shadow-lg">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {bgAnimationLayer}

                {shouldRenderCustomThemeLogos && leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : shouldRenderPlatformLogo ? (
                    <div className="absolute z-50" style={{ left: '1.5vw', top: '8.5vh' }}>
                        <Logo variant="dark" size="xl" animate />
                    </div>
                ) : null}

                {shouldRenderCustomThemeLogos && rightLogoUrl ? (
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
                            {effectivePresentationTitle || DEFAULT_PRESENTATION_TITLE}
                        </h1>
                        <p className="text-2xl font-medium" style={{ color: textColorSecondary }}>
                            {effectivePresentationDescription || 'Sorularınızı göndermek için QR kodu taratın veya PIN kodunu girin.'}
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
            <div className="min-h-screen bg-[#0a051d] overflow-hidden relative flex flex-col" style={{ ...(baseStyle || {}), color: textColor, animation: 'viewFadeIn 0.4s ease-out' }}>
                {shouldShowOpeningBackdrop ? openingBackdropLayer : null}
                {demoWatermarkLayer}
                {qrExpandedLayer}
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
                    <div className="w-full bg-black/75 backdrop-blur-md py-4 px-6 text-center z-50 shrink-0 border-b border-white/15">
                        <p className="text-xl font-bold drop-shadow-md" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-extrabold text-white underline underline-offset-2">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-300 text-2xl tracking-widest drop-shadow-lg">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {bgAnimationLayer}

                {shouldRenderCustomThemeLogos && leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : shouldRenderPlatformLogo ? (
                    <div className="absolute z-50" style={{ left: '1.5vw', top: '8.5vh' }}>
                        <Logo variant="dark" size="xl" animate />
                    </div>
                ) : null}

                {shouldRenderCustomThemeLogos && rightLogoUrl ? (
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
                            <p className="font-black leading-[1.08] tracking-tight italic drop-shadow-lg" style={{ color: textColor, fontSize: currentQuestion.questionText.length > 200 ? '1.5rem' : currentQuestion.questionText.length > 150 ? '2rem' : currentQuestion.questionText.length > 100 ? '2.5rem' : currentQuestion.questionText.length > 60 ? '3rem' : '4rem', marginBottom: currentQuestion.questionText.length > 100 ? '1.5rem' : '2.5rem' }}>
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

                            {cardBrandLogoUrl ? (
                                <div className="mt-10 flex justify-end">
                                    <img
                                        src={cardBrandLogoUrl}
                                        alt={cardBrandLogoAlt}
                                        className="h-8 opacity-90"
                                    />
                                </div>
                            ) : null}
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
            <div className="min-h-screen bg-[#0a051d] overflow-hidden relative flex flex-col" style={{ ...(baseStyle || {}), color: textColor, animation: 'viewFadeIn 0.4s ease-out' }}>
                {shouldShowOpeningBackdrop ? openingBackdropLayer : null}
                {demoWatermarkLayer}
                {qrExpandedLayer}

                {!hasThemeBackground && !hasOpeningBackdrop ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-indigo-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-purple-600/18 rounded-full blur-[140px]"></div>
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                ) : null}

                {showInstructions ? (
                    <div className="w-full bg-black/75 backdrop-blur-md py-4 px-6 text-center z-50 shrink-0 border-b border-white/15">
                        <p className="text-xl font-bold drop-shadow-md" style={{ color: textColor }}>
                            Şu adrese girip: <span className="font-extrabold text-white underline underline-offset-2">{joinHostname}</span> | kodu girin:{' '}
                            <span className="font-black text-yellow-300 text-2xl tracking-widest drop-shadow-lg">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                        </p>
                    </div>
                ) : null}

                {bgAnimationLayer}

                {shouldRenderCustomThemeLogos && leftLogoUrl ? (
                    <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
                ) : shouldRenderPlatformLogo ? (
                    <div className="absolute z-50" style={{ left: '1.5vw', top: '8.5vh' }}>
                        <Logo variant="dark" size="xl" animate />
                    </div>
                ) : null}

                {shouldRenderCustomThemeLogos && rightLogoUrl ? (
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

                <div className="flex-1 flex items-start justify-center px-12 pt-4 pb-12 relative z-10">
                    <div className="w-full max-w-6xl max-h-[65vh] flex flex-col">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/12 rounded-[4rem] shadow-2xl flex flex-col overflow-hidden" style={{ padding: currentQuestion.questionText.length > 120 ? '2.5rem 3rem' : currentQuestion.questionText.length > 80 ? '3rem 4rem' : '4rem 5rem' }}>
                            <p className="font-black leading-[1.08] tracking-tight italic drop-shadow-lg flex-1" style={{ color: textColor, fontSize: currentQuestion.questionText.length > 200 ? '1.5rem' : currentQuestion.questionText.length > 150 ? '2rem' : currentQuestion.questionText.length > 100 ? '2.5rem' : currentQuestion.questionText.length > 60 ? '3rem' : '4rem', marginBottom: currentQuestion.questionText.length > 100 ? '1.5rem' : '2.5rem' }}>
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

                            {cardBrandLogoUrl ? (
                                <div className="mt-10 flex justify-end">
                                    <img
                                        src={cardBrandLogoUrl}
                                        alt={cardBrandLogoAlt}
                                        className="h-8 opacity-90"
                                    />
                                </div>
                            ) : null}
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
        <div className="min-h-screen bg-[#0a051d] flex flex-col overflow-hidden relative" style={{ ...(baseStyle || {}), color: textColor, animation: 'viewFadeIn 0.4s ease-out' }}>
            {openingBackdropLayer}
            {demoWatermarkLayer}
            {qrExpandedLayer}
            {/* Top Instruction Bar */}
            {showInstructions ? (
                <div className="w-full bg-black/75 backdrop-blur-md py-4 px-6 text-center z-50 shrink-0 border-b border-white/15">
                    <p className="text-xl font-bold drop-shadow-md" style={{ color: textColor }}>
                        Şu adrese girip: <span className="font-extrabold text-white underline underline-offset-2">{joinHostname}</span> | kodu girin:{' '}
                        <span className="font-black text-yellow-300 text-2xl tracking-widest drop-shadow-lg">{eventData?.eventPin || '...'}</span> veya QR kodu taratın
                    </p>
                </div>
            ) : null}

            {bgAnimationLayer}

            {shouldRenderCustomThemeLogos && leftLogoUrl ? (
                <img src={leftLogoUrl} alt="Logo" className="absolute z-50 object-contain" style={leftLogoStyle} />
            ) : shouldRenderPlatformLogo ? (
                <div className="absolute z-50" style={{ left: '1.5vw', top: '8.5vh' }}>
                    <Logo variant="dark" size="xl" animate />
                </div>
            ) : null}

            {shouldRenderCustomThemeLogos && rightLogoUrl ? (
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
                <div className="flex items-start justify-end gap-4">
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
                    {showQR ? (
                        <div className="flex items-center gap-4 p-3 bg-black/30 rounded-2xl border border-white/12 backdrop-blur-md">
                            <div className="bg-white p-2 rounded-xl">
                                <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: textColorMuted }}>KOD</p>
                                <p className="text-3xl font-black tracking-wider" style={{ color: textColor }}>{eventData?.eventPin || '...'}</p>
                            </div>
                        </div>
                    ) : null}
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
                        className="max-w-[2200px] mx-auto grid gap-3"
                        style={{ gridTemplateColumns: `repeat(${wallCols}, minmax(0, 1fr))` }}
                    >
                        {(wallQuestions.length ? wallQuestions : renderQuestions || []).slice(0, maxWallCards).map((q: any) => {
                            const isNew = Boolean(wallPulseIds[q.id]);
                            return (
                                <div key={q.id}>
                                    <div
                                        className={
                                            "bg-black/40 backdrop-blur-xl border border-white/12 rounded-2xl p-3 shadow-2xl h-[125px] flex flex-col justify-between " +
                                            "transform-gpu transition-transform duration-300 ease-out " +
                                            (isNew ? "scale-[1.02]" : "scale-100")
                                        }
                                        style={isNew ? { animation: "wallPop 700ms ease-out" } : undefined}
                                    >
                                        <p
                                            className="text-[clamp(0.8rem,0.95vw,1.2rem)] font-black leading-snug tracking-tight"
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
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 overflow-hidden">
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
                                                <p className="text-[clamp(0.65rem,0.7vw,0.85rem)] font-black truncate" style={{ color: textColorSecondary }}>
                                                            {displayName(q.participantName)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {cardBrandLogoUrl ? (
                                                <img
                                                    src={cardBrandLogoUrl}
                                                    alt={cardBrandLogoAlt}
                                                    className="h-8 opacity-80 shrink-0"
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
        <div className="min-h-screen bg-[#0a051d] text-white overflow-hidden relative flex flex-col" style={{ animation: 'viewFadeIn 0.4s ease-out' }}>
            {demoWatermarkLayer}
            {/* Top Instruction Bar */}
            <div className="w-full bg-black/30 backdrop-blur-md py-3 px-6 text-center z-50 shrink-0">
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
