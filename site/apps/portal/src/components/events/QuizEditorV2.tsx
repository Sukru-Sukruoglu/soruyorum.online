"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Type,
    Palette,
    Target,
    Lock,
    Image as ImageIcon,
    ChevronDown,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Settings,
    Copy,
    Trash2,
    Home,
    PlusCircle,
    Brush,
    HelpCircle,
    Eye,
    Save,
    Play,
    ChevronLeft,
    Square,
    Monitor,
    Check,
    Users,
    Trophy,
    Clipboard,
    Scissors,
    Eraser,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';
import CreateEventModal from '@/components/Event/CreateEventModal';
import { getEvent, updateEvent, Event } from '@/services/api';
import { isSuperAdminRole, hasFullAccessRole } from '@/utils/auth';
import { fetchPortalAuthSession } from '@/utils/authSession';
import { UpgradeContactModal } from '@/components/upgrade/UpgradeContactModal';
import { Logo } from '@ks-interaktif/ui';

// --- Constants & Types ---

const LIVE_PREVIEW_W = 1920;
const LIVE_PREVIEW_H = 1080;
const MOBILE_PREVIEW_W = 390;
const MOBILE_PREVIEW_H = 844;
const LOGO_BASE_X = 0;
const LOGO_BASE_Y = 72;

function resolveWindowOrigin(rawUrl?: string | null, fallbackOrigin?: string) {
    if (!rawUrl) return fallbackOrigin || null;

    try {
        return new URL(rawUrl, fallbackOrigin || undefined).origin;
    } catch {
        return fallbackOrigin || null;
    }
}

function ScaledIframe({
    src,
    title,
    iframeRef,
    overlay,
    onScaleChange,
    baseWidth = LIVE_PREVIEW_W,
    baseHeight = LIVE_PREVIEW_H,
}: {
    src: string;
    title: string;
    iframeRef?: React.Ref<HTMLIFrameElement>;
    overlay?: React.ReactNode;
    onScaleChange?: (scale: number) => void;
    baseWidth?: number;
    baseHeight?: number;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ left: 0, top: 0 });

    // Double-buffer: A/B swap — two iframes alternate roles (front / back)
    const iframeARef = useRef<HTMLIFrameElement | null>(null);
    const iframeBRef = useRef<HTMLIFrameElement | null>(null);
    const [srcA, setSrcA] = useState(src);
    const [srcB, setSrcB] = useState<string | null>(null);
    const [frontIs, setFrontIs] = useState<'A' | 'B'>('A');

    // When src changes, load it in the back iframe
    useEffect(() => {
        const currentFrontSrc = frontIs === 'A' ? srcA : srcB;
        const currentBackSrc = frontIs === 'A' ? srcB : srcA;

        if (src === currentFrontSrc) return;

        if (src === currentBackSrc) {
            setFrontIs((prev) => (prev === 'A' ? 'B' : 'A'));
            return;
        }

        if (frontIs === 'A') {
            setSrcB(src);
        } else {
            setSrcA(src);
        }
    }, [frontIs, src, srcA, srcB]);

    const handleBackLoad = useCallback(() => {
        // Swap: back becomes front
        setFrontIs((prev) => (prev === 'A' ? 'B' : 'A'));
    }, []);

    // Forward the iframeRef to whichever iframe is currently front
    useEffect(() => {
        const frontEl = frontIs === 'A' ? iframeARef.current : iframeBRef.current;
        if (typeof iframeRef === 'function') iframeRef(frontEl);
        else if (iframeRef && typeof iframeRef === 'object') (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = frontEl;
    }, [frontIs, iframeRef]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const compute = () => {
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const next = rect.width / baseWidth;
            setScale(Number.isFinite(next) && next > 0 ? next : 1);
            setOffset({ left: 0, top: 0 });
            onScaleChange?.(Number.isFinite(next) && next > 0 ? next : 1);
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
    }, [baseWidth, onScaleChange]);

    const isAFront = frontIs === 'A';
    const backSrc = isAFront ? srcB : srcA;

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#0a051d]">
            <div
                className="absolute"
                style={{
                    width: baseWidth,
                    height: baseHeight,
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                    left: offset.left,
                    top: offset.top,
                }}
            >
                {/* Iframe A */}
                <iframe
                    title={isAFront ? title : `${title} (loading)`}
                    src={srcA ?? undefined}
                    ref={iframeARef}
                    width={baseWidth}
                    height={baseHeight}
                    className="block absolute inset-0"
                    style={{ border: 0, zIndex: isAFront ? 1 : 0, opacity: isAFront ? 1 : 0, pointerEvents: isAFront ? 'auto' : 'none' }}
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    scrolling="no"
                    {...(!isAFront && srcA ? { onLoad: handleBackLoad } : {})}
                />

                {/* Iframe B */}
                {srcB != null && (
                    <iframe
                        title={!isAFront ? title : `${title} (loading)`}
                        src={srcB}
                        ref={iframeBRef}
                        width={baseWidth}
                        height={baseHeight}
                        className="block absolute inset-0"
                        style={{ border: 0, zIndex: !isAFront ? 1 : 0, opacity: !isAFront ? 1 : 0, pointerEvents: !isAFront ? 'auto' : 'none' }}
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        scrolling="no"
                        {...(isAFront && srcB ? { onLoad: handleBackLoad } : {})}
                    />
                )}

                {overlay ? (
                    <div className="absolute inset-0 z-10 pointer-events-auto">
                        {overlay}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ─── Collapsible sidebar section (eventimo-style) ─── */
function CollapsibleSection({ title, icon, defaultOpen = true, children }: {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#e8ecf1] pb-3 mb-3">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 py-1.5 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider hover:text-black transition-colors"
            >
                <ChevronDown className={`h-3 w-3 transition-transform flex-shrink-0 ${open ? '' : '-rotate-90'}`} />
                {icon}
                <span>{title}</span>
            </button>
            {open && <div className="mt-2 space-y-3">{children}</div>}
        </div>
    );
}

/* ─── Option color presets for quiz answers ─── */
const OPTION_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const THEMES = {
    business: 'linear-gradient(135deg, #450a0a 0%, #dc2626 100%)', // Dark Red to Red
    social: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    growth: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    tech: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    lifestyle: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    entertainment: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    travel: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    fun: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    food: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    music: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
    blank: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
};

const DOUBLE_THEME_NAMES: Record<keyof typeof THEMES, string> = {
    business: 'İş',
    social: 'Sosyal',
    growth: 'Büyüme',
    tech: 'Teknoloji',
    lifestyle: 'Yaşam',
    entertainment: 'Eğlence',
    travel: 'Seyahat',
    fun: 'Eğlenceli',
    food: 'Yemek',
    music: 'Müzik',
    blank: 'Boş',
};

const pickPrimaryFromGradient = (gradient: string, fallback: string) => {
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
    if (!matches || !matches.length) return fallback;
    return matches[matches.length - 1] || fallback;
};

const DOUBLE_COLOR_THEMES = (Object.entries(THEMES) as Array<[keyof typeof THEMES, string]>).map(
    ([id, background]) => ({
        id,
        name: DOUBLE_THEME_NAMES[id] || String(id),
        background,
        backgroundColor: background,
        primaryColor: pickPrimaryFromGradient(background, '#dc2626'),
    })
);

const CF_IMG = 'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ';
const DEFAULT_THEME_BG = 'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/547991cc-0396-4e5e-754e-b08a20faf800/soruyorum';
const LEGACY_DEFAULT_THEME_BGS = new Set([
    `${CF_IMG}/4f7f6fbe-cbf6-4b8f-4f0f-fe0255594400/soruyorum`,
]);

const DEFAULT_GRADIENT_ANIMATION_START = '#6366f1';
const DEFAULT_GRADIENT_ANIMATION_END = '#8b5cf6';

const resolveThemeImageUrl = (value: string | undefined | null) => {
    const nextValue = String(value || '').trim();
    if (!nextValue) return DEFAULT_THEME_BG;
    return LEGACY_DEFAULT_THEME_BGS.has(nextValue) ? DEFAULT_THEME_BG : nextValue;
};

const QANDA_BACKGROUNDS = [
    `${CF_IMG}/cbd35c73-a014-4224-1e5a-8caba4a22400/soruyorum`,
    `${CF_IMG}/6adbde61-a4b5-4764-5c16-7f45b8cef600/soruyorum`,
    `${CF_IMG}/4f329592-c5b0-4cb2-1464-9a801668c800/soruyorum`,
    `${CF_IMG}/0e9eb39e-65f5-4287-30b6-7e15fc3a4e00/soruyorum`,
    `${CF_IMG}/333eadb4-3041-4f84-61c4-e293022a7600/soruyorum`,
    `${CF_IMG}/56e926e5-7cf4-4044-aa2f-6c922221fa00/soruyorum`,
    `${CF_IMG}/f7276fd2-008d-4698-c76c-b6e1e2096500/soruyorum`,
    `${CF_IMG}/c84c7d44-9a89-4986-05c2-cda2f5cd1900/soruyorum`,
];

const THEME_CATEGORIES = [
    {
        id: 'qanda',
        name: '❓ Q&A',
        themes: QANDA_BACKGROUNDS.map((background, i) => ({
            id: `qanda${i + 1}`,
            name: `Q&A ${i + 1}`,
            background,
            primaryColor: '#dc2626',
        })),
    },
    {
        id: 'double',
        name: '🌈 Çift renkler',
        themes: [
            { id: 'featured1', name: 'Varsayılan', background: DEFAULT_THEME_BG, primaryColor: '#6366f1' },
            ...DOUBLE_COLOR_THEMES,
        ],
    },
    {
        id: 'festival',
        name: '🎉 Festival',
        themes: [
            { id: 'festival', name: 'Festival', background: `${CF_IMG}/e346be68-c51f-4b9d-e51b-5e79dcc4bc00/soruyorum`, primaryColor: '#f59e0b' },
            { id: 'festival2', name: 'Gençlik', background: `${CF_IMG}/dc56d708-579e-4d88-0307-103b3139ed00/soruyorum`, primaryColor: '#ea580c' },
            { id: 'birthday', name: 'Doğum Günü', background: `${CF_IMG}/1cdf3f80-cade-458d-068a-f6724b904800/soruyorum`, primaryColor: '#ec4899' },
            { id: 'wedding', name: 'Düğün', background: `${CF_IMG}/1be4374d-0b96-4478-6165-feee9c392600/soruyorum`, primaryColor: '#f472b6' },
            { id: 'ramadan', name: 'Ramazan', background: `${CF_IMG}/0f05b57d-2ba0-4a3d-7de5-0ced71150700/soruyorum`, primaryColor: '#fbbf24' },
            { id: 'newyear', name: 'Yılbaşı', background: `${CF_IMG}/d561a985-dec8-4316-c7d0-6b7ac8543c00/soruyorum`, primaryColor: '#fcd34d' },
            { id: 'party', name: 'Parti', background: `${CF_IMG}/090f75dd-d62b-4b95-f71f-e9b4d8419200/soruyorum`, primaryColor: '#ef4444' },
            { id: 'celebration', name: 'Kutlama', background: `${CF_IMG}/007fece7-3380-4fe1-fde3-dcfb178d0200/soruyorum`, primaryColor: '#22c55e' },
        ]
    },
    {
        id: 'confetti',
        name: '🎊 Konfeti',
        themes: [
            { id: 'confetti1', name: 'Konfeti 1', background: `${CF_IMG}/5c1fc779-21c8-4ae0-d34e-c4aa5fe2e100/soruyorum`, primaryColor: '#8b5cf6' },
            { id: 'confetti2', name: 'Konfeti 2', background: `${CF_IMG}/31b1142a-c1b1-4666-344b-dd20b78c1500/soruyorum`, primaryColor: '#ec4899' },
            { id: 'confetti3', name: 'Konfeti 3', background: `${CF_IMG}/49eeeae5-8639-4df6-0014-8f9454497f00/soruyorum`, primaryColor: '#06b6d4' },
            { id: 'confetti4', name: 'Konfeti 4', background: `${CF_IMG}/e77d66a9-53d5-46a1-6dbf-9d9475558d00/soruyorum`, primaryColor: '#f59e0b' },
            { id: 'confetti5', name: 'Konfeti 5', background: `${CF_IMG}/d8d8c778-c1e9-4c64-183f-aa39130feb00/soruyorum`, primaryColor: '#22c55e' },
            { id: 'confetti6', name: 'Konfeti 6', background: `${CF_IMG}/44cafaae-2e30-4c5d-f4ea-57470b2edf00/soruyorum`, primaryColor: '#ef4444' },
            { id: 'confetti7', name: 'Konfeti 7', background: `${CF_IMG}/4faedbb9-2aaa-40c4-c31f-f0bd7a476600/soruyorum`, primaryColor: '#3b82f6' },
            { id: 'confetti8', name: 'Konfeti 8', background: `${CF_IMG}/9286da32-a117-4629-d24e-8226fa571000/soruyorum`, primaryColor: '#a855f7' },
        ]
    },
    {
        id: 'balloon',
        name: '🎈 Balon',
        themes: [
            { id: 'balloon1', name: 'Balon 1', background: `${CF_IMG}/ddb274d7-ff30-43a6-54dd-fbb6883e3000/soruyorum`, primaryColor: '#ef4444' },
            { id: 'balloon2', name: 'Balon 2', background: `${CF_IMG}/10e76006-0f12-4697-f2d0-27dcad851800/soruyorum`, primaryColor: '#8b5cf6' },
            { id: 'balloon3', name: 'Balon 3', background: `${CF_IMG}/f2f8c5aa-484f-4860-7d40-09a5893bee00/soruyorum`, primaryColor: '#fbbf24' },
            { id: 'balloon4', name: 'Balon 4', background: `${CF_IMG}/7fafb0e0-d626-4e75-b580-427ae1bb9500/soruyorum`, primaryColor: '#ec4899' },
            { id: 'balloon5', name: 'Balon 5', background: `${CF_IMG}/f877068d-02dc-4f7b-00e8-2d58f5dec300/soruyorum`, primaryColor: '#06b6d4' },
            { id: 'balloon6', name: 'Balon 6', background: `${CF_IMG}/2e2f9c60-e267-486f-ee4c-112a1eb29200/soruyorum`, primaryColor: '#22c55e' },
            { id: 'balloon7', name: 'Balon 7', background: `${CF_IMG}/64ec9551-b2be-4533-db94-35af89684900/soruyorum`, primaryColor: '#f59e0b' },
            { id: 'balloon8', name: 'Balon 8', background: `${CF_IMG}/4b4874da-1d10-4ce3-9121-85b99c290000/soruyorum`, primaryColor: '#a855f7' },
            { id: 'balloon9', name: 'Balon 9', background: `${CF_IMG}/6260e789-1ac4-491d-8c8d-ed0d42156900/soruyorum`, primaryColor: '#3b82f6' },
            { id: 'balloon10', name: 'Balon 10', background: `${CF_IMG}/7128a33a-4666-43e1-4389-4bb4c08a2c00/soruyorum`, primaryColor: '#14b8a6' },
        ]
    },
    {
        id: 'nature',
        name: '🌿 Doğa',
        themes: [
            { id: 'sunset', name: 'Gün Batımı', background: `${CF_IMG}/270fc5b0-0d40-4f09-9143-974395390800/soruyorum`, primaryColor: '#f97316' },
            { id: 'forest', name: 'Orman', background: `${CF_IMG}/a9e4bc71-9fe5-4afa-4d4f-1f853fd49d00/soruyorum`, primaryColor: '#22c55e' },
            { id: 'autumn', name: 'Sonbahar', background: `${CF_IMG}/dc32a4de-84bb-48ef-7811-a357bf4bb300/soruyorum`, primaryColor: '#ea580c' },
            { id: 'autumn2', name: 'Sonbahar Yolu', background: `${CF_IMG}/b922c585-c2a9-40fd-d16e-bcb9b4b8a000/soruyorum`, primaryColor: '#b45309' },
            { id: 'spring', name: 'İlkbahar', background: `${CF_IMG}/397508a0-a685-4213-5815-7ca0b3821500/soruyorum`, primaryColor: '#84cc16' },
            { id: 'beach', name: 'Sahil', background: `${CF_IMG}/01d7e7cd-df59-4abe-66fb-9ab024e27b00/soruyorum`, primaryColor: '#0ea5e9' },
            { id: 'mountain', name: 'Dağ', background: `${CF_IMG}/50872c00-a7f7-4fac-bb79-f7c34539f000/soruyorum`, primaryColor: '#64748b' },
        ]
    },
    {
        id: 'professional',
        name: '💼 Profesyonel',
        themes: [
            { id: 'corporate', name: 'Kurumsal', background: `${CF_IMG}/fe816ff5-0e50-4fb1-909c-f54d6021b300/soruyorum`, primaryColor: '#3b82f6' },
            { id: 'modern', name: 'Modern', background: `${CF_IMG}/d78a7533-59f7-460e-628f-dabd6d474900/soruyorum`, primaryColor: '#06b6d4' },
            { id: 'classic', name: 'Klasik', background: `${CF_IMG}/60e8260a-54a7-46a4-b980-6190f3a41500/soruyorum`, primaryColor: '#78350f' },
            { id: 'elegant', name: 'Şık', background: `${CF_IMG}/24f9d930-5833-4259-b4b0-86b0360c3300/soruyorum`, primaryColor: '#a855f7' },
            { id: 'dark', name: 'Koyu', background: `${CF_IMG}/5fb19f55-c6e9-4907-578d-abe855f16400/soruyorum`, primaryColor: '#1f2937' },
            { id: 'luxury', name: 'Lüks', background: `${CF_IMG}/76b7e848-0206-40cb-5b85-670acc5a4300/soruyorum`, primaryColor: '#b45309' },
        ]
    },
    {
        id: 'sports',
        name: '⚽ Spor',
        themes: [
            { id: 'football', name: 'Futbol', background: `${CF_IMG}/a8278968-5a81-4127-6ca2-014d86294500/soruyorum`, primaryColor: '#22c55e' },
            { id: 'basketball', name: 'Basketbol', background: `${CF_IMG}/f5c4735f-fa7c-42af-d792-ad67a5889700/soruyorum`, primaryColor: '#f97316' },
            { id: 'tennis', name: 'Tenis', background: `${CF_IMG}/2f6713ba-fc19-48d9-c378-402b3c40f100/soruyorum`, primaryColor: '#84cc16' },
            { id: 'racing', name: 'Yarış', background: `${CF_IMG}/2ec5b791-015e-4204-598a-1dfd849d6b00/soruyorum`, primaryColor: '#ef4444' },
            { id: 'swimming', name: 'Yüzme', background: `${CF_IMG}/8774c9c3-5cc2-4809-587d-1e0007816e00/soruyorum`, primaryColor: '#0ea5e9' },
            { id: 'fitness', name: 'Fitness', background: `${CF_IMG}/7aad48e7-a949-4159-bdf9-9b6858292a00/soruyorum`, primaryColor: '#f43f5e' },
        ]
    },
    {
        id: 'education',
        name: '📚 Eğitim',
        themes: [
            { id: 'school', name: 'Okul', background: `${CF_IMG}/dfd7e591-dcc9-4121-cdf3-2ffd586d3d00/soruyorum`, primaryColor: '#3b82f6' },
            { id: 'science', name: 'Bilim', background: `${CF_IMG}/3a608e98-e3be-416d-3391-bf81c4bcc600/soruyorum`, primaryColor: '#8b5cf6' },
            { id: 'art', name: 'Sanat', background: `${CF_IMG}/97c5cc5c-0f53-4e39-51e6-e4e01c98a800/soruyorum`, primaryColor: '#ec4899' },
            { id: 'math', name: 'Matematik', background: `${CF_IMG}/eac991bd-68a3-4e78-18e8-04fb9d0fb500/soruyorum`, primaryColor: '#14b8a6' },
            { id: 'music', name: 'Müzik', background: `${CF_IMG}/66f468a2-8e65-471b-ea61-3befbd270c00/soruyorum`, primaryColor: '#f59e0b' },
            { id: 'reading', name: 'Okuma', background: `${CF_IMG}/bdd4bfe0-8d52-4019-9299-cb80204ad300/soruyorum`, primaryColor: '#6366f1' },
        ]
    },
    {
        id: 'solid',
        name: '🔵 Düz Renkler',
        themes: [
            { id: 'red', name: 'Kırmızı', backgroundColor: '#dc2626', primaryColor: '#dc2626' },
            { id: 'blue', name: 'Mavi', backgroundColor: '#2563eb', primaryColor: '#2563eb' },
            { id: 'green', name: 'Yeşil', backgroundColor: '#16a34a', primaryColor: '#16a34a' },
            { id: 'purple', name: 'Mor', backgroundColor: '#9333ea', primaryColor: '#9333ea' },
            { id: 'orange', name: 'Turuncu', backgroundColor: '#ea580c', primaryColor: '#ea580c' },
            { id: 'pink', name: 'Pembe', backgroundColor: '#ec4899', primaryColor: '#ec4899' },
            { id: 'cyan', name: 'Turkuaz', backgroundColor: '#06b6d4', primaryColor: '#06b6d4' },
            { id: 'indigo', name: 'İndigo', backgroundColor: '#4f46e5', primaryColor: '#4f46e5' },
            { id: 'black', name: 'Siyah', backgroundColor: '#1f2937', primaryColor: '#1f2937' },
        ]
    },
];

const FONTS = [
    { name: 'Inter (Varsayılan)', value: "'Inter', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Poppins', value: "'Poppins', sans-serif" },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Open Sans', value: "'Open Sans', sans-serif" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Nunito', value: "'Nunito', sans-serif" },
    { name: 'Raleway', value: "'Raleway', sans-serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Georgia', value: "'Georgia', serif" },
];

const TEXT_COLORS = [
    '#ffffff', '#000000', '#2c3e50', '#e74c3c', '#3498db',
    '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
];

interface SlideStyle {
    fontFamily: string;
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    shadow: boolean;
    headingX: number;
    headingY: number;
}

interface LogoSettings {
    url: string | null;
    x: number;
    y: number;
    size: number;
    anchor?: 'top-right' | 'bottom-right';
    shadow?: boolean;
    shadowColor?: string;
}

interface MobileThemeSettings {
    enabled: boolean;
    style?: string | null;
    primaryColor?: string | null;
    bgAnimation?: boolean;
    bgAnimationType?: string;
    auroraColorPreset?: string;
    gradientColorStart?: string | null;
    gradientColorEnd?: string | null;
    colorPalette?: string;
    backgroundColor?: string | null;
    backgroundImage?: string | null;
    background?: string | null;
    textColor?: string | null;
    logoUrl?: string | null;
    heroLogoUrl?: string | null;
    heroPanelColor?: string | null;
    heroTitleColor?: string | null;
    heroSubtitleColor?: string | null;
    buttonColorStart?: string | null;
    buttonColorEnd?: string | null;
}

interface Slide {
    id: number;
    type: 'q-and-a';
    question: string;
    background: string;
    image: string | null;
    style: SlideStyle;
}

const DEFAULT_MOBILE_THEME_SETTINGS: MobileThemeSettings = {
    enabled: false,
    style: null,
    primaryColor: null,
    bgAnimation: false,
    bgAnimationType: 'gradient',
    auroraColorPreset: 'blue',
    gradientColorStart: DEFAULT_GRADIENT_ANIMATION_START,
    gradientColorEnd: DEFAULT_GRADIENT_ANIMATION_END,
    colorPalette: 'koyu',
    backgroundColor: null,
    backgroundImage: null,
    background: null,
    textColor: null,
    logoUrl: null,
    heroLogoUrl: null,
    heroPanelColor: null,
    heroTitleColor: null,
    heroSubtitleColor: null,
    buttonColorStart: '#6366f1',
    buttonColorEnd: '#8b5cf6',
};

export function QuizEditorV2({
    eventId,
    eventPin,
    eventData: initialEventData,
}: {
    eventId: string;
    eventPin?: string;
    eventData?: Event | null;
}) {
    const router = useRouter();
    const DEFAULT_PRESENTATION_TITLE = 'Soru Yorum';
    const DEFAULT_PRESENTATION_DESCRIPTION = 'Sorularınızı göndermek için QR kodu taratın veya PIN kodunu girin.';
    // --- State ---
    const [slides, setSlides] = useState<Slide[]>([
        {
            id: 1,
            type: 'q-and-a',
            question: "Merak Ettikleriniz?",
            background: `url(${DEFAULT_THEME_BG})`,
            image: null,
            style: {
                fontFamily: "'Inter', sans-serif",
                fontSize: 48,
                color: '#ffffff',
                bold: false,
                italic: false,
                underline: false,
                shadow: false,
                headingX: 0,
                headingY: 0
            }
        }
    ]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('properties');
    const [designPanelView, setDesignPanelView] = useState<'main' | 'mobile'>('main');
    const [presentationTitle, setPresentationTitle] = useState(DEFAULT_PRESENTATION_TITLE);
    const [presentationDescription, setPresentationDescription] = useState(DEFAULT_PRESENTATION_DESCRIPTION);

    // Quiz / slide question state
    const [questionType, setQuestionType] = useState<'q-and-a' | 'multiple_choice' | 'true_false' | 'open_ended'>('q-and-a');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState([
        { id: 'A', text: 'Seçenek 1', color: '#3B82F6' },
        { id: 'B', text: 'Seçenek 2', color: '#22C55E' },
        { id: 'C', text: 'Seçenek 3', color: '#F59E0B' },
        { id: 'D', text: 'Seçenek 4', color: '#EF4444' },
    ]);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(true);
    const [showAverage, setShowAverage] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [hideSlide, setHideSlide] = useState(false);
    const [answerDelay, setAnswerDelay] = useState(0);

    // Eventimo-style DAVRANIŞ extras
    const [answerFormat, setAnswerFormat] = useState<'standard' | 'custom'>('custom');
    const [customResultLayout, setCustomResultLayout] = useState(false);
    const [correctAnswerDisplay, setCorrectAnswerDisplay] = useState<'global' | 'always' | 'never'>('global');
    const [changeAnswer, setChangeAnswer] = useState<'global' | 'always' | 'never'>('global');
    const [showOptionsUntilCountdown, setShowOptionsUntilCountdown] = useState(false);
    const [hideTimer, setHideTimer] = useState(false);
    const [noInstantFeedback, setNoInstantFeedback] = useState(false);

    // PUANLAMA
    const [pointsCorrect, setPointsCorrect] = useState(1000);
    const [pointsWrong, setPointsWrong] = useState(0);
    const [enableSpeedBonus, setEnableSpeedBonus] = useState(true);

    // Center view mode


    // Live screen headings (Duvar / Tek tek)
    const [wallHeadingTitle, setWallHeadingTitle] = useState(DEFAULT_PRESENTATION_TITLE);
    const [wallHeadingSubtitle, setWallHeadingSubtitle] = useState('Yeni sorular otomatik eklenir.');
    const [rotateHeadingTitle, setRotateHeadingTitle] = useState(DEFAULT_PRESENTATION_TITLE);
    const [rotateHeadingSubtitle, setRotateHeadingSubtitle] = useState('Sorular sırayla gösterilir.');

    // Settings State
    const [showInstructions, setShowInstructions] = useState(true);
    const [showQR, setShowQR] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [showNames, setShowNames] = useState(true);
    const [bgAnimation, setBgAnimation] = useState(false);
    const [bgAnimationType, setBgAnimationType] = useState('gradient');
    const [auroraColorPreset, setAuroraColorPreset] = useState('blue');
    const [gradientColorStart, setGradientColorStart] = useState(DEFAULT_GRADIENT_ANIMATION_START);
    const [gradientColorEnd, setGradientColorEnd] = useState(DEFAULT_GRADIENT_ANIMATION_END);

    // Live screen (ekran.*) layout
    const [screenMode, setScreenMode] = useState<'wall' | 'rotate'>('wall');

    // Logos
    const [logo, setLogo] = useState<LogoSettings>({ url: null, x: 0, y: 0, size: 240, shadow: false, shadowColor: '#ffffff' });
    const [rightLogo, setRightLogo] = useState<LogoSettings>({ url: null, x: 0, y: 0, size: 240, anchor: 'top-right', shadow: false, shadowColor: '#ffffff' });
    const [mobileThemeEnabled, setMobileThemeEnabled] = useState(false);
    const [mobileThemeSettings, setMobileThemeSettings] = useState<MobileThemeSettings>(DEFAULT_MOBILE_THEME_SETTINGS);
    const [activeMobileThemeCategory, setActiveMobileThemeCategory] = useState('double');

    // QR Position
    const [qrPos, setQrPos] = useState({ x: 40, y: 40 });

    // Toggles
    const [isLocked, setIsLocked] = useState(false);
    const [requireCode, setRequireCode] = useState(true);
    const [allowMultiple, setAllowMultiple] = useState(true);
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [liveResults, setLiveResults] = useState(true);

    // UI State
    const [textColorDropdownOpen, setTextColorDropdownOpen] = useState(false);
    const [homeRibbonTextColorDropdownOpen, setHomeRibbonTextColorDropdownOpen] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [upgradeContactOpen, setUpgradeContactOpen] = useState(false);
    const [eventData, setEventData] = useState<Event | null>(initialEventData ?? null);
    const [isPresentationStarted, setIsPresentationStarted] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [topMenuTab, setTopMenuTab] = useState<'home' | 'design' | 'question'>('home');
    const [activeThemeCategory, setActiveThemeCategory] = useState('double');
    const [livePreviewView, setLivePreviewView] = useState<'join' | 'wall' | 'rotate'>('join');
    const [livePreviewAuto, setLivePreviewAuto] = useState(false);
    // Live preview is always enabled (no on/off toggle)
    const centerLivePreview = true;
    const [livePreviewNonce, setLivePreviewNonce] = useState(0);
    const [mobilePreviewNonce, setMobilePreviewNonce] = useState(0);
    const [livePreviewScale, setLivePreviewScale] = useState(1);
    const [activeLogoControl, setActiveLogoControl] = useState<'left' | 'right' | null>(null);
    const livePreviewIframeRef = useRef<HTMLIFrameElement | null>(null);
    const mobilePreviewIframeRef = useRef<HTMLIFrameElement | null>(null);
    const propertiesTabRef = useRef<HTMLDivElement | null>(null);
    const designTabRef = useRef<HTMLDivElement | null>(null);
    const logoInteractionRef = useRef<
        | {
            mode: 'move' | 'resize';
            target: 'left' | 'right';
            anchor?: 'top-right' | 'bottom-right';
            pointerId?: number;
            captureEl?: HTMLElement | null;
            startClientX: number;
            startClientY: number;
            startX: number;
            startY: number;
            startSize: number;
        }
        | null
    >(null);

    // Hostname state - initialized empty for SSR compatibility
    const [hostName, setHostName] = useState('');

    useEffect(() => {
        void fetchPortalAuthSession()
            .then((session) => setRole(session.role))
            .catch(() => setRole(null));
    }, []);

    /* Force dark body for editor (DashboardShell skips bg for editor pages) */
    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        body.classList.add('editor-page');
        body.style.setProperty('background-color', '#1a1b2e', 'important');
        body.style.setProperty('color', '#e2e8f0', 'important');
        body.style.setProperty('overflow', 'hidden', 'important');
        html.style.setProperty('background-color', '#1a1b2e', 'important');
        return () => {
            body.classList.remove('editor-page');
            body.style.backgroundColor = '';
            body.style.color = '';
            body.style.overflow = '';
            html.style.backgroundColor = '';
        };
    }, []);

    useEffect(() => {
        const activePanel = activeTab === 'properties' ? propertiesTabRef.current : designTabRef.current;
        if (activePanel) {
            activePanel.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [activeTab]);

    const canUseBrandingLogos = useMemo(() => {
        if (hasFullAccessRole(role)) return true;

        const access = (eventData as any)?.access;
        if (typeof access?.features?.branding === 'boolean') {
            return access.features.branding;
        }

        const plan = String(access?.plan || '').trim().toLowerCase();
        return plan.endsWith('_wl');
    }, [eventData, role]);

    const canUseAdvancedDesigns = canUseBrandingLogos;

    const limitedThemeIds = useMemo(() => {
        return new Set<string>(['featured1', ...DOUBLE_COLOR_THEMES.map((theme) => theme.id)]);
    }, []);

    const visibleThemeCategories = useMemo(() => {
        if (canUseAdvancedDesigns) return THEME_CATEGORIES;
        return THEME_CATEGORIES.filter((category) => category.id === 'double');
    }, [canUseAdvancedDesigns]);

    const activeThemeList = useMemo(() => {
        return (visibleThemeCategories.find((c) => c.id === activeThemeCategory)?.themes || []) as Array<any>;
    }, [activeThemeCategory, visibleThemeCategories]);

    useEffect(() => {
        if (visibleThemeCategories.some((category) => category.id === activeThemeCategory)) return;
        setActiveThemeCategory(visibleThemeCategories[0]?.id || 'double');
    }, [activeThemeCategory, visibleThemeCategories]);

    useEffect(() => {
        if (visibleThemeCategories.some((category) => category.id === activeMobileThemeCategory)) return;
        setActiveMobileThemeCategory(visibleThemeCategories[0]?.id || 'double');
    }, [activeMobileThemeCategory, visibleThemeCategories]);

    const clamp = useCallback((value: number, min: number, max: number) => {
        return Math.min(max, Math.max(min, value));
    }, []);

    const beginLogoInteraction = useCallback((
        e: React.MouseEvent | React.PointerEvent,
        target: 'left' | 'right',
        mode: 'move' | 'resize'
    ) => {
        if (!canUseBrandingLogos) {
            setUpgradeContactOpen(true);
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const current = target === 'left' ? logo : rightLogo;
        if (!current?.url) return;

        let pointerId: number | undefined;
        let captureEl: HTMLElement | null = null;
        if ('pointerId' in e) {
            pointerId = e.pointerId;
            captureEl = e.currentTarget as HTMLElement;
            try {
                captureEl?.setPointerCapture?.(e.pointerId);
            } catch {
                // no-op
            }
        }

        setActiveLogoControl(target);
        logoInteractionRef.current = {
            mode,
            target,
            anchor: target === 'right' ? rightLogo.anchor : undefined,
            pointerId,
            captureEl,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startX: typeof current.x === 'number' ? current.x : 0,
            startY: typeof current.y === 'number' ? current.y : 0,
            startSize: typeof current.size === 'number' ? current.size : 240,
        };
    }, [canUseBrandingLogos, logo, rightLogo]);

    const adjustLogoSizeByWheel = useCallback((target: 'left' | 'right', deltaY: number) => {
        if (!canUseBrandingLogos) {
            setUpgradeContactOpen(true);
            return;
        }

        const amount = deltaY < 0 ? 14 : -14;
        if (target === 'left') {
            setLogo((prev) => ({ ...prev, size: clamp((prev.size || 240) + amount, 60, 800) }));
            return;
        }
        setRightLogo((prev) => ({ ...prev, size: clamp((prev.size || 240) + amount, 60, 800) }));
    }, [canUseBrandingLogos, clamp]);

    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            const current = logoInteractionRef.current;
            if (!current) return;
            e.preventDefault();

            const scale = livePreviewScale > 0 ? livePreviewScale : 1;
            const dx = (e.clientX - current.startClientX) / scale;
            const dy = (e.clientY - current.startClientY) / scale;

            if (current.mode === 'move') {
                const logoSize = clamp(current.startSize || 240, 60, 800);

                let minX = -24;
                let maxX = LIVE_PREVIEW_W - LOGO_BASE_X - logoSize;
                let minY = -LOGO_BASE_Y;
                let maxY = LIVE_PREVIEW_H - LOGO_BASE_Y;

                minX = -LOGO_BASE_X;

                if (current.target === 'right') {
                    minX = -(LIVE_PREVIEW_W - LOGO_BASE_X - logoSize);
                    maxX = LOGO_BASE_X;

                    if (current.anchor === 'bottom-right') {
                        minY = -(LIVE_PREVIEW_H - LOGO_BASE_Y);
                        maxY = LOGO_BASE_Y;
                    }
                }

                const nextX = clamp(Math.round(current.startX + dx), minX, maxX);
                const nextY = clamp(Math.round(current.startY + dy), minY, maxY);

                if (current.target === 'left') {
                    setLogo((prev) => ({ ...prev, x: nextX, y: nextY }));
                } else {
                    setRightLogo((prev) => ({ ...prev, x: nextX, y: nextY }));
                }
                return;
            }

            const sizeChange = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
            const nextSize = clamp(Math.round(current.startSize + sizeChange), 60, 800);
            if (current.target === 'left') {
                setLogo((prev) => ({ ...prev, size: nextSize }));
            } else {
                setRightLogo((prev) => ({ ...prev, size: nextSize }));
            }
        };

        const onPointerUp = () => {
            const current = logoInteractionRef.current;
            if (!current) return;
            if (typeof current.pointerId === 'number') {
                try {
                    current.captureEl?.releasePointerCapture?.(current.pointerId);
                } catch {
                    // no-op
                }
            }
            logoInteractionRef.current = null;
        };

        const onNativeDragStart = (e: DragEvent) => {
            if (!logoInteractionRef.current) return;
            e.preventDefault();
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('dragstart', onNativeDragStart);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('dragstart', onNativeDragStart);
        };
    }, [clamp, livePreviewScale]);

    const activeThemeSlide = activeThemeList[0] as any;

    const interactivePreviewOverlay = centerLivePreview ? (
        <>
            {canUseBrandingLogos && logo.url ? (
                <div
                    className="absolute z-[80] pointer-events-auto cursor-move"
                    style={{
                        top: `${LOGO_BASE_Y}px`,
                        left: `${LOGO_BASE_X}px`,
                        transform: `translate(${logo.x}px, ${logo.y}px)`,
                        touchAction: 'none',
                    }}
                    onPointerDown={(e) => beginLogoInteraction(e, 'left', 'move')}
                    onWheel={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        adjustLogoSizeByWheel('left', e.deltaY);
                    }}
                    title="Logoyu sürükle, tekerlekle boyutlandır"
                >
                    <div className={`relative ${activeLogoControl === 'left' ? 'ring-4 ring-blue-400 rounded-md' : ''}`}>
                        <img
                            src={logo.url}
                            alt="Sol Logo"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            className="select-none object-contain"
                            style={{ width: `${logo.size}px`, ...(logo.shadow ? { filter: `drop-shadow(0 0 8px ${logo.shadowColor || '#ffffff'}80) drop-shadow(0 0 20px ${logo.shadowColor || '#ffffff'}40)` } : {}) }}
                        />
                        <button
                            type="button"
                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-600 text-white text-base leading-none flex items-center justify-center shadow-lg cursor-se-resize border-2 border-white"
                            onPointerDown={(e) => beginLogoInteraction(e, 'left', 'resize')}
                            title="Boyutlandır"
                        >
                            ↘
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    ) : null;

    const postPreviewUpdate = useCallback((payload: { pt?: string; pd?: string }) => {
        const win = livePreviewIframeRef.current?.contentWindow;
        if (!win) return;
        const targetOrigin = resolveWindowOrigin(livePreviewIframeRef.current?.src, window.location.origin);
        if (!targetOrigin) return;

        win.postMessage(
            { type: 'SORUYORUM_PREVIEW_UPDATE', payload },
            targetOrigin
        );
    }, []);

    const postPreviewSettings = useCallback((payload: Record<string, boolean | string>) => {
        const win = livePreviewIframeRef.current?.contentWindow;
        if (!win) return;
        const targetOrigin = resolveWindowOrigin(livePreviewIframeRef.current?.src, window.location.origin);
        if (!targetOrigin) return;
        win.postMessage(
            { type: 'SORUYORUM_PREVIEW_SETTINGS', payload },
            targetOrigin
        );
    }, []);

    const buildMobilePreviewTheme = useCallback((themeSource: Record<string, any>) => {
        const sourceTheme = themeSource || {};
        const mobileTheme = sourceTheme.mobile && typeof sourceTheme.mobile === 'object'
            ? sourceTheme.mobile
            : {};
        const mobileThemeEnabled = mobileTheme.enabled === true;
        const effectiveTheme = mobileThemeEnabled
            ? {
                ...sourceTheme,
                ...mobileTheme,
            }
            : sourceTheme;

        return {
            bgAnimation: effectiveTheme.bgAnimation ?? false,
            bgAnimationType: effectiveTheme.bgAnimationType ?? 'gradient',
            auroraColorPreset: effectiveTheme.auroraColorPreset ?? 'blue',
            gradientColorStart: effectiveTheme.gradientColorStart ?? DEFAULT_GRADIENT_ANIMATION_START,
            gradientColorEnd: effectiveTheme.gradientColorEnd ?? DEFAULT_GRADIENT_ANIMATION_END,
            colorPalette: effectiveTheme.colorPalette ?? 'koyu',
            backgroundColor: effectiveTheme.backgroundColor ?? null,
            backgroundImage: effectiveTheme.backgroundImage ?? null,
            background: effectiveTheme.background ?? null,
            textColor: effectiveTheme.textColor ?? null,
            buttonColorStart: effectiveTheme.buttonColorStart ?? null,
            buttonColorEnd: effectiveTheme.buttonColorEnd ?? null,
            heroLogoUrl: effectiveTheme.heroLogoUrl ?? null,
            heroPanelColor: effectiveTheme.heroPanelColor ?? null,
            heroTitleColor: effectiveTheme.heroTitleColor ?? null,
            heroSubtitleColor: effectiveTheme.heroSubtitleColor ?? null,
            logoUrl: mobileThemeEnabled
                ? effectiveTheme.logoUrl || null
                : sourceTheme.rightLogo?.url || sourceTheme.rightLogoUrl || null,
            rightLogoUrl: sourceTheme.rightLogo?.url || sourceTheme.rightLogoUrl || null,
            rightLogoShadow: sourceTheme.rightLogo?.shadow ?? false,
            rightLogoShadowColor: sourceTheme.rightLogo?.shadowColor || '#ffffff',
        };
    }, []);

    const postMobilePreviewSettings = useCallback((payload: Record<string, any>) => {
        const win = mobilePreviewIframeRef.current?.contentWindow;
        if (!win) return;
        const targetOrigin = resolveWindowOrigin(mobilePreviewIframeRef.current?.src, window.location.origin);
        if (!targetOrigin) return;
        win.postMessage(
            { type: 'SORUYORUM_PREVIEW_SETTINGS', payload },
            targetOrigin
        );
    }, []);

    // Avoid visible iframe refresh while typing: send updates via postMessage.
    useEffect(() => {
        const t = window.setTimeout(() => {
            postPreviewUpdate({
                pt: presentationTitle,
                pd: presentationDescription,
            });
        }, 150);
        return () => window.clearTimeout(t);
    }, [presentationTitle, presentationDescription, livePreviewView, livePreviewNonce, postPreviewUpdate]);

    // If the iframe reloads, it will lose in-memory overrides.
    // The embed page sends a READY handshake so we can re-send the latest values.
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            const allowedOrigins = new Set<string>();
            if (typeof window !== 'undefined') {
                allowedOrigins.add(window.location.origin);
            }

            const livePreviewOrigin = resolveWindowOrigin(livePreviewIframeRef.current?.src, window.location.origin);
            const mobilePreviewOrigin = resolveWindowOrigin(mobilePreviewIframeRef.current?.src, window.location.origin);

            if (livePreviewOrigin) allowedOrigins.add(livePreviewOrigin);
            if (mobilePreviewOrigin) allowedOrigins.add(mobilePreviewOrigin);

            if (!allowedOrigins.has(e.origin)) return;
            const data = (e.data || {}) as any;
            if (!data || data.type !== 'SORUYORUM_PREVIEW_READY') return;
            postPreviewUpdate({
                pt: presentationTitle,
                pd: presentationDescription,
            });

            // Also flush pending autosave so a refresh doesn't lose recent typing.
            void persistPresentationTitle(presentationTitle);
            void persistPresentationDescription(presentationDescription);
            void persistLiveHeadings({
                wallTitle: wallHeadingTitle,
                wallSubtitle: wallHeadingSubtitle,
                rotateTitle: rotateHeadingTitle,
                rotateSubtitle: rotateHeadingSubtitle,
            });
            const latestTheme = (((eventData as any)?.settings || {}).theme || {}) as Record<string, any>;
            postMobilePreviewSettings(buildMobilePreviewTheme(latestTheme));
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [
        buildMobilePreviewTheme,
        eventData,
        postMobilePreviewSettings,
        postPreviewUpdate,
        presentationTitle,
        presentationDescription,
        wallHeadingTitle,
        wallHeadingSubtitle,
        rotateHeadingTitle,
        rotateHeadingSubtitle,
    ]);

    useEffect(() => {
        if (!livePreviewAuto) return;
        const order: Array<'wall' | 'rotate'> = ['wall', 'rotate'];
        const t = setInterval(() => {
            setLivePreviewView((prev) => {
                const currentView = prev === 'join' ? 'wall' : prev;
                const idx = order.indexOf(currentView);
                return order[(idx + 1) % order.length] || 'wall';
            });
        }, 3500);
        return () => clearInterval(t);
    }, [livePreviewAuto]);

    const parseHexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const raw = (hex || '').trim();
        if (!raw.startsWith('#')) return null;
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
    };

    const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
        const rr = r / 255;
        const gg = g / 255;
        const bb = b / 255;

        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        const delta = max - min;

        let h = 0;
        if (delta !== 0) {
            if (max === rr) h = ((gg - bb) / delta) % 6;
            else if (max === gg) h = (bb - rr) / delta + 2;
            else h = (rr - gg) / delta + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        const l = (max + min) / 2;
        const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        return {
            h,
            s: Math.round(s * 1000) / 10,
            l: Math.round(l * 1000) / 10,
        };
    };

    const hexToHslVar = (hex: string): string | undefined => {
        const rgb = parseHexToRgb(hex);
        if (!rgb) return undefined;
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    };

    const toRgbaFromHex = (hex: string, alpha: number, fallback: string) => {
        const rgb = parseHexToRgb(hex);
        if (!rgb) return fallback;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    };

    const deriveColorPaletteFromTextColor = (textColor: string): string | undefined => {
        const rgb = parseHexToRgb(textColor);
        if (!rgb) return undefined;
        const srgb = [rgb.r, rgb.g, rgb.b].map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
        // Low luminance => dark text => "koyu"; otherwise use "acik".
        return luminance < 0.5 ? 'koyu' : 'acik';
    };

    const isImageValue = useCallback((value: string | undefined | null) => {
        if (!value) return false;
        return value.startsWith('/') || value.startsWith('http') || value.startsWith('data:image/');
    }, []);

    const normalizeBackgroundValue = useCallback((value: string | undefined | null) => {
        const nextValue = resolveThemeImageUrl(value);
        if (!nextValue) return `url(${DEFAULT_THEME_BG})`;
        if (nextValue.startsWith('url(')) return nextValue;
        if (
            nextValue.includes('gradient(') ||
            nextValue.startsWith('#') ||
            nextValue.startsWith('rgb(') ||
            nextValue.startsWith('rgba(') ||
            nextValue.startsWith('hsl(') ||
            nextValue.startsWith('hsla(')
        ) {
            return nextValue;
        }
        if (isImageValue(nextValue)) return `url(${nextValue})`;
        return nextValue;
    }, [isImageValue]);

    const syncEditorStateFromEvent = useCallback((data: any) => {
        if (!data) return;

        setEventData(data);

        const themeSettings = ((data as any)?.settings?.theme || {}) as any;
        const initialMode = ((data as any)?.settings?.qanda?.screenMode as string | undefined) || 'wall';
        setScreenMode(initialMode === 'rotate' ? 'rotate' : 'wall');

        const hasPresentationTitle = Object.prototype.hasOwnProperty.call(themeSettings, 'presentationTitle');
        const nextPresentationTitle = hasPresentationTitle
            ? String((themeSettings as any)?.presentationTitle ?? '')
            : DEFAULT_PRESENTATION_TITLE;
        setPresentationTitle(nextPresentationTitle);
        lastPersistedTitleRef.current = nextPresentationTitle.trim();

        let themeBackground = `url(${DEFAULT_THEME_BG})`;
        if (isImageValue(themeSettings.backgroundImage)) {
            themeBackground = `url(${themeSettings.backgroundImage})`;
        } else if (themeSettings.background && themeSettings.background.includes('gradient')) {
            themeBackground = themeSettings.background;
        } else if (isImageValue(themeSettings.backgroundColor)) {
            themeBackground = `url(${themeSettings.backgroundColor})`;
        } else if (themeSettings.backgroundColor) {
            themeBackground = themeSettings.backgroundColor;
        } else if (themeSettings.style && THEMES[themeSettings.style as keyof typeof THEMES]) {
            themeBackground = THEMES[themeSettings.style as keyof typeof THEMES];
        }

        if (!hasLoggedEditorInitRef.current) {
            console.info('[editor-init] fetched event theme', {
                eventId: (data as any)?.id,
                screenMode: initialMode,
                themeStyle: themeSettings.style || null,
                rawBackgroundImage: themeSettings.backgroundImage || null,
                rawBackground: themeSettings.background || null,
                rawBackgroundColor: themeSettings.backgroundColor || null,
                normalizedThemeBackground: themeBackground,
            });
        }

        setSlides(prevSlides => prevSlides.map(slide => ({
            ...slide,
            background: normalizeBackgroundValue(themeBackground),
        })));

        if (typeof themeSettings.showInstructions === 'boolean') setShowInstructions(themeSettings.showInstructions);
        if (typeof themeSettings.showQR === 'boolean') setShowQR(themeSettings.showQR);
        if (typeof themeSettings.showStats === 'boolean') setShowStats(themeSettings.showStats);
        if (typeof themeSettings.showNames === 'boolean') setShowNames(themeSettings.showNames);
        if (typeof themeSettings.bgAnimation === 'boolean') setBgAnimation(themeSettings.bgAnimation);
        if (typeof themeSettings.bgAnimationType === 'string') setBgAnimationType(themeSettings.bgAnimationType);
        if (typeof themeSettings.auroraColorPreset === 'string') setAuroraColorPreset(themeSettings.auroraColorPreset);
        setGradientColorStart(typeof themeSettings.gradientColorStart === 'string' ? themeSettings.gradientColorStart : DEFAULT_GRADIENT_ANIMATION_START);
        setGradientColorEnd(typeof themeSettings.gradientColorEnd === 'string' ? themeSettings.gradientColorEnd : DEFAULT_GRADIENT_ANIMATION_END);

        if (themeSettings.qrPos && typeof themeSettings.qrPos.x === 'number' && typeof themeSettings.qrPos.y === 'number') {
            setQrPos({ x: themeSettings.qrPos.x, y: themeSettings.qrPos.y });
        }

        if (themeSettings.logo && typeof themeSettings.logo === 'object') {
            setLogo((prev) => ({ ...prev, ...(themeSettings.logo || {}) }));
        } else {
            setLogo((prev) => ({ ...prev, url: typeof themeSettings.logoUrl === 'string' ? themeSettings.logoUrl || null : null }));
        }

        if (themeSettings.rightLogo && typeof themeSettings.rightLogo === 'object') {
            setRightLogo((prev) => ({ ...prev, ...(themeSettings.rightLogo || {}) }));
        } else {
            setRightLogo((prev) => ({ ...prev, url: typeof themeSettings.rightLogoUrl === 'string' ? themeSettings.rightLogoUrl || null : null }));
        }

        const nextMobileThemeRaw = themeSettings.mobile && typeof themeSettings.mobile === 'object'
            ? (themeSettings.mobile as Record<string, any>)
            : {};
        const nextMobileTheme = {
            ...DEFAULT_MOBILE_THEME_SETTINGS,
            ...nextMobileThemeRaw,
            enabled: Boolean(nextMobileThemeRaw.enabled),
        } as MobileThemeSettings;
        setMobileThemeEnabled(nextMobileTheme.enabled);
        setMobileThemeSettings(nextMobileTheme);

        if (typeof themeSettings.fontFamily === 'string' && themeSettings.fontFamily) {
            const nextFont = themeSettings.fontFamily;
            setSlides((prevSlides) =>
                prevSlides.map((s) => ({
                    ...s,
                    style: {
                        ...s.style,
                        fontFamily: nextFont,
                    },
                }))
            );
        }

        if (typeof themeSettings.textColor === 'string' && themeSettings.textColor.trim()) {
            const nextTextColor = themeSettings.textColor.trim();
            setSlides((prevSlides) =>
                prevSlides.map((s) => ({
                    ...s,
                    style: {
                        ...s.style,
                        color: nextTextColor,
                    },
                }))
            );
        }

        const hasPresentationDescription = Object.prototype.hasOwnProperty.call(themeSettings as any, 'presentationDescription');
        const nextPresentationDescription = hasPresentationDescription
            ? String((themeSettings as any)?.presentationDescription || '')
            : DEFAULT_PRESENTATION_DESCRIPTION;
        setPresentationDescription(nextPresentationDescription);
        lastPersistedPresentationDescriptionRef.current = nextPresentationDescription;

        const initialHeadings = {
            wallTitle: String((themeSettings as any)?.wallTitle || nextPresentationTitle || '').trim() || DEFAULT_PRESENTATION_TITLE,
            wallSubtitle: String((themeSettings as any)?.wallSubtitle || 'Yeni sorular otomatik eklenir.'),
            rotateTitle: String((themeSettings as any)?.rotateTitle || nextPresentationTitle || '').trim() || DEFAULT_PRESENTATION_TITLE,
            rotateSubtitle: String((themeSettings as any)?.rotateSubtitle || 'Sorular sırayla gösterilir.'),
        };
        setWallHeadingTitle(initialHeadings.wallTitle);
        setWallHeadingSubtitle(initialHeadings.wallSubtitle);
        setRotateHeadingTitle(initialHeadings.rotateTitle);
        setRotateHeadingSubtitle(initialHeadings.rotateSubtitle);
        lastPersistedHeadingsRef.current = {
            wallTitle: initialHeadings.wallTitle.trim(),
            wallSubtitle: initialHeadings.wallSubtitle.trim(),
            rotateTitle: initialHeadings.rotateTitle.trim(),
            rotateSubtitle: initialHeadings.rotateSubtitle.trim(),
        };
    }, [normalizeBackgroundValue]);

    const refreshEditorStateFromServer = useCallback(async () => {
        const data = await getEvent(eventId);
        syncEditorStateFromEvent(data);
        return data;
    }, [eventId, syncEditorStateFromEvent]);

    const updateThemeSettings = async (patch: Record<string, any>) => {
        if (!eventData) return;

        const nextPatch = { ...(patch || {}) } as Record<string, any>;
        const animationSyncKeys = new Set([
            'bgAnimation',
            'bgAnimationType',
            'auroraColorPreset',
            'gradientColorStart',
            'gradientColorEnd',
        ]);
        const changesBackground =
            'background' in nextPatch || 'backgroundImage' in nextPatch || 'backgroundColor' in nextPatch;
        // Default opening backdrop (image) / video should be shown only until the user changes the theme/background.
        // Once they do, explicitly disable it unless they are setting it intentionally.
        if (changesBackground && !('openingVideoUrl' in nextPatch)) {
            nextPatch.openingVideoUrl = '';
        }
        if (changesBackground && !('openingBackgroundUrl' in nextPatch)) {
            nextPatch.openingBackgroundUrl = '';
        }

        const prevSettings = (eventData as any)?.settings || {};
        const prevTheme = prevSettings?.theme || {};
        const prevMobileTheme = prevTheme.mobile && typeof prevTheme.mobile === 'object'
            ? (prevTheme.mobile as Record<string, any>)
            : {};
        const shouldSyncMobileAnimation = prevMobileTheme.enabled === true && Object.keys(nextPatch).some((key) => animationSyncKeys.has(key));
        const syncedMobileTheme = shouldSyncMobileAnimation
            ? {
                ...DEFAULT_MOBILE_THEME_SETTINGS,
                ...prevMobileTheme,
                ...Object.fromEntries(
                    Object.entries(nextPatch).filter(([key]) => animationSyncKeys.has(key))
                ),
                enabled: true,
            } as MobileThemeSettings
            : null;
        const nextTheme = {
            ...prevTheme,
            ...nextPatch,
            ...(syncedMobileTheme ? { mobile: syncedMobileTheme } : {}),
        };
        const nextSettings = {
            ...prevSettings,
            theme: nextTheme,
        };

        try {
            const updated = await updateEvent(eventData.id, { settings: nextSettings } as any);
            setEventData((prev) => ({ ...(prev as any), ...(updated as any), settings: (updated as any)?.settings ?? nextSettings }));
            // Reload the center live preview iframe only when needed.
            // Reloading on every tiny change (e.g. text color) feels like a full page refresh.
            // Toggle settings (showInstructions, showQR etc.) are sent via postMessage
            // to avoid a visible black flash caused by iframe remount.
            const postMessageKeys = new Set([
                'showInstructions',
                'showQR',
                'showStats',
                'showNames',
                'bgAnimation',
                'bgAnimationType',
                'auroraColorPreset',
                'gradientColorStart',
                'gradientColorEnd',
            ]);
            const stringPostMessageKeys = new Set([
                'bgAnimationType',
                'auroraColorPreset',
                'gradientColorStart',
                'gradientColorEnd',
            ]);
            const reloadKeys = new Set([
                'style',
                'primaryColor',
                'background',
                'backgroundColor',
                'backgroundImage',
                'mobile',
                'wallTitle',
                'wallSubtitle',
                'rotateTitle',
                'rotateSubtitle',
            ]);

            // Send toggle changes via postMessage (instant, no flicker)
            const pmPatch: Record<string, boolean | string> = {};
            for (const k of Object.keys(nextPatch)) {
                if (postMessageKeys.has(k)) {
                    pmPatch[k] = stringPostMessageKeys.has(k) ? String(nextPatch[k]) : Boolean(nextPatch[k]);
                }
            }
            if (Object.keys(pmPatch).length > 0) postPreviewSettings(pmPatch);
            postMobilePreviewSettings(buildMobilePreviewTheme(nextTheme));
            if (syncedMobileTheme) {
                setMobileThemeEnabled(true);
                setMobileThemeSettings(syncedMobileTheme);
            }

            const patchKeys = Object.keys(nextPatch || {});
            const shouldReloadMainPreview = patchKeys.some((k) => reloadKeys.has(k));
            if (shouldReloadMainPreview) setLivePreviewNonce((v) => v + 1);
        } catch (err) {
            const response = (err as any)?.response?.data;
            if (response?.feature === 'branding_logos') {
                try {
                    await refreshEditorStateFromServer();
                } catch {
                    // ignore refresh failures and surface the original error below
                }
                setLivePreviewNonce((v) => v + 1);
                setMobilePreviewNonce((v) => v + 1);
                setUpgradeContactOpen(true);
                alert(response?.error || 'Logo ekleme sadece full branding dahil paketlerde kullanilabilir.');
                return;
            }
            if (response?.feature === 'advanced_designs') {
                try {
                    await refreshEditorStateFromServer();
                } catch {
                    // ignore refresh failures and surface the original error below
                }
                setLivePreviewNonce((v) => v + 1);
                setMobilePreviewNonce((v) => v + 1);
                setUpgradeContactOpen(true);
                alert(response?.error || 'Gelismis tasarimlar sadece full branding dahil paketlerde kullanilabilir.');
                return;
            }

            // Still reload preview on generic error so the user sees the latest persisted state.
            setLivePreviewNonce((v) => v + 1);
            setMobilePreviewNonce((v) => v + 1);
            console.error('Tema ayarları kaydetme hatası:', err);
        }
    };

    const handleTextColorPick = async (color: string) => {
        updateSlide('style.color', color);
        const derivedPalette = deriveColorPaletteFromTextColor(color);
        await updateThemeSettings({
            textColor: color,
            ...(derivedPalette ? { colorPalette: derivedPalette } : {}),
        });
    };

    const updateMobileThemeSettings = useCallback(async (patch: Partial<MobileThemeSettings>, enabled?: boolean) => {
        const currentTheme = ((eventData as any)?.settings?.theme || {}) as Record<string, any>;
        const prevMobile = currentTheme.mobile && typeof currentTheme.mobile === 'object'
            ? (currentTheme.mobile as Record<string, any>)
            : {};
        const nextMobile = {
            ...DEFAULT_MOBILE_THEME_SETTINGS,
            ...prevMobile,
            ...patch,
            enabled: enabled ?? Boolean(prevMobile.enabled),
        } as MobileThemeSettings;

        setMobileThemeEnabled(nextMobile.enabled);
        setMobileThemeSettings(nextMobile);
        await updateThemeSettings({ mobile: nextMobile });
    }, [eventData, updateThemeSettings]);

    const buildMobileThemeFromMain = useCallback((): MobileThemeSettings => {
        const baseTheme = (((eventData as any)?.settings?.theme) || {}) as Record<string, any>;
        const fallbackPrimary = String(baseTheme.primaryColor || '#6366f1');
        const fallbackText = String(baseTheme.textColor || '#ffffff');
        return {
            ...DEFAULT_MOBILE_THEME_SETTINGS,
            enabled: true,
            style: baseTheme.style ?? null,
            primaryColor: baseTheme.primaryColor ?? null,
            bgAnimation: baseTheme.bgAnimation ?? false,
            bgAnimationType: baseTheme.bgAnimationType ?? 'gradient',
            auroraColorPreset: baseTheme.auroraColorPreset ?? 'blue',
            gradientColorStart: baseTheme.gradientColorStart ?? fallbackPrimary,
            gradientColorEnd: baseTheme.gradientColorEnd ?? pickPrimaryFromGradient(String(baseTheme.background || ''), DEFAULT_GRADIENT_ANIMATION_END),
            colorPalette: baseTheme.colorPalette ?? 'koyu',
            backgroundColor: baseTheme.backgroundColor ?? null,
            backgroundImage: baseTheme.backgroundImage ?? null,
            background: baseTheme.background ?? null,
            textColor: baseTheme.textColor ?? null,
            logoUrl: baseTheme.rightLogo?.url ?? baseTheme.rightLogoUrl ?? baseTheme.logo?.url ?? baseTheme.logoUrl ?? null,
            heroLogoUrl: baseTheme.rightLogo?.url ?? baseTheme.rightLogoUrl ?? baseTheme.logo?.url ?? baseTheme.logoUrl ?? null,
            heroPanelColor: fallbackPrimary,
            heroTitleColor: fallbackText,
            heroSubtitleColor: fallbackText,
            buttonColorStart: fallbackPrimary,
            buttonColorEnd: pickPrimaryFromGradient(String(baseTheme.background || ''), fallbackPrimary),
        };
    }, [eventData]);

    const applyMobileTheme = useCallback(async (theme: any) => {
        if (!theme) return;
        if (!canUseAdvancedDesigns && !limitedThemeIds.has(theme.id)) {
            setUpgradeContactOpen(true);
            return;
        }

        const hasBackground = 'background' in theme && theme.background;
        const isImageBackground = hasBackground && isImageValue(theme.background);
        const isGradientBackground = hasBackground && !isImageBackground;

        await updateMobileThemeSettings({
            style: theme.id,
            primaryColor: theme.primaryColor,
            background: isGradientBackground ? theme.background : null,
            backgroundImage: isImageBackground ? theme.background : null,
            backgroundColor: !hasBackground ? ((theme as any).backgroundColor || theme.primaryColor) : null,
        }, true);
    }, [canUseAdvancedDesigns, limitedThemeIds, isImageValue, updateMobileThemeSettings]);

    const enableCustomMobileTheme = useCallback(async () => {
        const nextMobileTheme = buildMobileThemeFromMain();
        await updateMobileThemeSettings(nextMobileTheme, true);
    }, [buildMobileThemeFromMain, updateMobileThemeSettings]);

    const syncMobileThemeWithMain = useCallback(async () => {
        const nextMobileTheme = buildMobileThemeFromMain();
        await updateMobileThemeSettings(nextMobileTheme, true);
    }, [buildMobileThemeFromMain, updateMobileThemeSettings]);

    const disableCustomMobileTheme = useCallback(async () => {
        await updateMobileThemeSettings(mobileThemeSettings, false);
    }, [mobileThemeSettings, updateMobileThemeSettings]);

    const applyTheme = useCallback(async (theme: any) => {
        if (!theme) return;
        if (!canUseAdvancedDesigns && !limitedThemeIds.has(theme.id)) {
            setUpgradeContactOpen(true);
            return;
        }

        const hasBackground = 'background' in theme && theme.background;
        const isImageBackground = hasBackground && isImageValue(theme.background);
        const isGradientBackground = hasBackground && !isImageBackground;

        if (isImageBackground) {
            updateSlide('background', `url(${theme.background})`);
        } else if (hasBackground) {
            updateSlide('background', theme.background);
        } else {
            updateSlide('background', (theme as any).backgroundColor || theme.primaryColor);
        }

        await updateThemeSettings({
            style: theme.id,
            primaryColor: theme.primaryColor,
            // Gradient → save as 'background'; Image → save as 'backgroundImage'; Solid → save as 'backgroundColor'
            // Use null (not undefined) to clear stale fields — undefined is ignored by object spread
            background: isGradientBackground ? theme.background : null,
            backgroundImage: isImageBackground ? theme.background : null,
            backgroundColor: !hasBackground ? ((theme as any).backgroundColor || theme.primaryColor) : null,
        });
    }, [canUseAdvancedDesigns, limitedThemeIds, updateThemeSettings]);

    // Only superadmins should see the bare Soruyorum domain in the editor.
    // Other users should continue to use the event's canonical join domain.
    useEffect(() => {
        if (hasFullAccessRole(role)) {
            setHostName('soruyorum.online');
            return;
        }

        // Derive the displayed join hostname from the backend's canonical joinHost field.
        // This ensures the editor always shows the organization's actual primary domain,
        // not the editor's own browser host (which is soruyorum.online, not the join domain).
        // Priority 1: backend-provided joinHost (canonical, from organization_domains)
        const backendHost = ((eventData as any)?.joinHost || '').trim().toLowerCase();
        if (backendHost) {
            setHostName(backendHost);
            return;
        }

        // Priority 2: parse from joinUrl stored on event
        if (eventData?.joinUrl) {
            try {
                const url = new URL(eventData.joinUrl);
                const urlHost = (url.host || '').trim().toLowerCase();
                if (urlHost) {
                    setHostName(urlHost);
                    return;
                }
            } catch {
                // ignore
            }
        }

        setHostName('mobil.soruyorum.online');
    }, [role, (eventData as any)?.joinHost, eventData?.joinUrl]);

    const canonicalJoinUrl = useMemo(() => {
        const joinHost = hostName || '';
        const pin = eventPin || (eventData as any)?.eventPin || (eventData as any)?.event_pin || (eventData as any)?.pin || '';
        if (!joinHost) return '';
        const protocol = joinHost.includes('localhost') || joinHost.includes('192.168.68.73') ? 'http' : 'https';
        if (!pin) return `${protocol}://${joinHost}`;
        return `${protocol}://${joinHost}/join?pin=${encodeURIComponent(pin)}`;
    }, [hostName, eventData, eventPin]);

    const resolvedEventPin = useMemo(() => {
        return eventPin || (eventData as any)?.eventPin || (eventData as any)?.event_pin || (eventData as any)?.pin || '';
    }, [eventData, eventPin]);

    const qrCodeUrl = useMemo(() => {
        if (!canonicalJoinUrl) return '';
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(canonicalJoinUrl)}`;
    }, [canonicalJoinUrl]);

    const mobilePreviewSrc = useMemo(() => {
        if (!resolvedEventPin) return '/join';
        const previewMode = livePreviewView === 'join' ? 'entry' : 'joined';
        return `/join?pin=${encodeURIComponent(resolvedEventPin)}&preview=${previewMode}&v=${mobilePreviewNonce}`;
    }, [resolvedEventPin, livePreviewView, mobilePreviewNonce]);

    // Fetch Event Data
    useEffect(() => {
        if (initialEventData) {
            syncEditorStateFromEvent(initialEventData);
            return;
        }

        const fetchEvent = async () => {
            try {
                const data = await getEvent(eventId);
                syncEditorStateFromEvent(data);
            } catch (err) {
                console.error("Failed to fetch event:", err);
            }
        };
        fetchEvent();
    }, [eventId, initialEventData, syncEditorStateFromEvent]);

    const persistScreenMode = async (mode: 'wall' | 'rotate') => {
        if (!eventData) return;

        setScreenMode(mode);
        setLivePreviewView(mode);

        const prevSettings = (eventData as any)?.settings || {};
        const prevQanda = prevSettings?.qanda || {};
        const nextSettings = {
            ...prevSettings,
            qanda: {
                ...prevQanda,
                screenMode: mode,
            },
        };

        try {
            const updated = await updateEvent(eventData.id, { settings: nextSettings } as any);
            // Keep local eventData in sync for subsequent edits.
            setEventData((prev) => ({ ...(prev as any), ...(updated as any), settings: (updated as any)?.settings ?? nextSettings }));
        } catch (err) {
            console.error('Failed to persist screenMode:', err);
            alert('Ekran görünümü kaydedilemedi.');
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const rightLogoInputRef = useRef<HTMLInputElement>(null);
    const mobileLogoInputRef = useRef<HTMLInputElement>(null);
    const mobileBackgroundInputRef = useRef<HTMLInputElement>(null);
    const hasLoggedEditorInitRef = useRef(false);
    const lastPersistedTitleRef = useRef<string>('');
    const persistTitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPersistedPresentationDescriptionRef = useRef<string>('');
    const persistPresentationDescriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPersistedHeadingsRef = useRef<{ wallTitle: string; wallSubtitle: string; rotateTitle: string; rotateSubtitle: string } | null>(null);
    const persistHeadingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentSlide = slides[currentSlideIndex];
    const selectedThemeTextColor = ((eventData as any)?.settings?.theme?.textColor as string | undefined) || currentSlide?.style?.color;
    const leftLogoUrl = logo.url || ((eventData as any)?.settings?.theme?.logoUrl as string | undefined) || null;
    const rightLogoUrl = rightLogo.url || ((eventData as any)?.settings?.theme?.rightLogoUrl as string | undefined) || null;
    const mobileThemePreview = mobileThemeSettings || DEFAULT_MOBILE_THEME_SETTINGS;
    const mobileThemeButtonStart = mobileThemePreview.buttonColorStart || '#6366f1';
    const mobileThemeButtonEnd = mobileThemePreview.buttonColorEnd || '#8b5cf6';

    const uiPrimaryHex = useMemo(() => {
        const candidate =
            ((eventData as any)?.settings?.theme?.primaryColor as string | undefined) ||
            ((eventData as any)?.theme?.primaryColor as string | undefined) ||
            ((activeThemeSlide as any)?.primaryColor as string | undefined);
        const value = (candidate || '').trim();
        return value || '#ef4444';
    }, [eventData, activeThemeSlide]);

    const uiPrimaryHslVar = useMemo(() => {
        return hexToHslVar(uiPrimaryHex) || '0 84.2% 60.2%';
    }, [uiPrimaryHex]);

    // --- Actions ---

    const persistPresentationTitle = async (rawTitle: string) => {
        if (!eventData?.id) return;

        const nextTitle = String(rawTitle || '').trim();
        if (!nextTitle) return;
        if (nextTitle === lastPersistedTitleRef.current) return;

        try {
            await updateThemeSettings({ presentationTitle: nextTitle });
            lastPersistedTitleRef.current = nextTitle;
        } catch (err) {
            console.error('Failed to persist presentation title:', err);
            alert('Sunum başlığı kaydedilemedi.');
        }
    };

    const persistPresentationDescription = async (rawDescription: string) => {
        if (!eventData?.id) return;

        const nextDescription = String(rawDescription || '').trim();
        if (nextDescription === lastPersistedPresentationDescriptionRef.current) return;

        try {
            await updateThemeSettings({ presentationDescription: nextDescription });
            lastPersistedPresentationDescriptionRef.current = nextDescription;
        } catch (err) {
            console.error('Failed to persist presentation description:', err);
            alert('Sunum açıklaması kaydedilemedi.');
        }
    };

    const persistLiveHeadings = async (raw: { wallTitle: string; wallSubtitle: string; rotateTitle: string; rotateSubtitle: string }) => {
        if (!eventData?.id) return;

        const trimmed = {
            wallTitle: String(raw.wallTitle || '').trim() || DEFAULT_PRESENTATION_TITLE,
            wallSubtitle: String(raw.wallSubtitle || '').trim(),
            rotateTitle: String(raw.rotateTitle || '').trim() || DEFAULT_PRESENTATION_TITLE,
            rotateSubtitle: String(raw.rotateSubtitle || '').trim(),
        };

        const last = lastPersistedHeadingsRef.current;
        if (
            last &&
            last.wallTitle === trimmed.wallTitle &&
            last.wallSubtitle === trimmed.wallSubtitle &&
            last.rotateTitle === trimmed.rotateTitle &&
            last.rotateSubtitle === trimmed.rotateSubtitle
        ) {
            return;
        }

        lastPersistedHeadingsRef.current = trimmed;
        await updateThemeSettings({
            wallTitle: trimmed.wallTitle,
            wallSubtitle: trimmed.wallSubtitle,
            rotateTitle: trimmed.rotateTitle,
            rotateSubtitle: trimmed.rotateSubtitle,
        });
    };

    useEffect(() => {
        if (hasLoggedEditorInitRef.current) return;
        if (!currentSlide) return;

        const normalizedBackground = normalizeBackgroundValue(currentSlide.background);
        console.info('[editor-init] first slide state', {
            slideCount: slides.length,
            currentSlideIndex,
            question: currentSlide.question,
            rawBackground: currentSlide.background,
            normalizedBackground,
            isImageBackground: normalizedBackground.startsWith('url('),
        });

        hasLoggedEditorInitRef.current = true;
    }, [currentSlide, currentSlideIndex, slides.length]);

    useEffect(() => {
        if (!eventData?.id) return;

        const nextTitle = String(presentationTitle || '').trim();
        if (!nextTitle) return;
        if (nextTitle === lastPersistedTitleRef.current) return;

        if (persistTitleTimerRef.current) {
            clearTimeout(persistTitleTimerRef.current);
        }
        persistTitleTimerRef.current = setTimeout(() => {
            void persistPresentationTitle(nextTitle);
        }, 600);

        return () => {
            if (persistTitleTimerRef.current) {
                clearTimeout(persistTitleTimerRef.current);
                persistTitleTimerRef.current = null;
            }
        };
    }, [presentationTitle, eventData?.id]);

    useEffect(() => {
        if (!eventData?.id) return;

        const nextDescription = String(presentationDescription || '').trim();
        if (nextDescription === lastPersistedPresentationDescriptionRef.current) return;

        if (persistPresentationDescriptionTimerRef.current) {
            clearTimeout(persistPresentationDescriptionTimerRef.current);
        }
        persistPresentationDescriptionTimerRef.current = setTimeout(() => {
            void persistPresentationDescription(nextDescription);
        }, 600);

        return () => {
            if (persistPresentationDescriptionTimerRef.current) {
                clearTimeout(persistPresentationDescriptionTimerRef.current);
                persistPresentationDescriptionTimerRef.current = null;
            }
        };
    }, [presentationDescription, eventData?.id]);

    useEffect(() => {
        if (!eventData?.id) return;

        if (persistHeadingsTimerRef.current) {
            clearTimeout(persistHeadingsTimerRef.current);
        }

        persistHeadingsTimerRef.current = setTimeout(() => {
            void persistLiveHeadings({
                wallTitle: wallHeadingTitle,
                wallSubtitle: wallHeadingSubtitle,
                rotateTitle: rotateHeadingTitle,
                rotateSubtitle: rotateHeadingSubtitle,
            });
        }, 600);

        return () => {
            if (persistHeadingsTimerRef.current) {
                clearTimeout(persistHeadingsTimerRef.current);
                persistHeadingsTimerRef.current = null;
            }
        };
    }, [wallHeadingTitle, wallHeadingSubtitle, rotateHeadingTitle, rotateHeadingSubtitle, eventData?.id]);

    const updateSlide = (key: string, value: any) => {
        const newSlides = [...slides];
        const slide = newSlides[currentSlideIndex];

        if (key.startsWith('style.')) {
            const styleKey = key.split('.')[1] as keyof SlideStyle;
            // @ts-ignore
            slide.style[styleKey] = value;
        } else {
            // @ts-ignore
            slide[key] = value;
        }
        setSlides(newSlides);
    };

    const deleteSlide = (index: number) => {
        if (slides.length <= 1) return;
        const newSlides = slides.filter((_, i) => i !== index);
        setSlides(newSlides);
        if (currentSlideIndex >= index && currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        } else if (currentSlideIndex >= newSlides.length) {
            setCurrentSlideIndex(newSlides.length - 1);
        }
    };

    const addSlide = () => {
        const newSlide: Slide = {
            id: Date.now(),
            type: 'q-and-a',
            question: '',
            background: normalizeBackgroundValue(currentSlide?.background),
            image: null,
            style: {
                fontFamily: "'Inter', sans-serif",
                fontSize: 48,
                color: '#ffffff',
                bold: false,
                italic: false,
                underline: false,
                shadow: false,
                headingX: 0,
                headingY: 0,
            },
        };
        setSlides([...slides, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const duplicateSlide = (index: number) => {
        const original = slides[index];
        const copy: Slide = { ...original, id: Date.now(), style: { ...original.style } };
        const newSlides = [...slides];
        newSlides.splice(index + 1, 0, copy);
        setSlides(newSlides);
        setCurrentSlideIndex(index + 1);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: any) => void, field?: string) => {
        if ((field === 'logo' || field === 'rightLogo' || field === 'mobileLogo') && !canUseBrandingLogos) {
            e.target.value = '';
            setUpgradeContactOpen(true);
            return;
        }

        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (field === 'image') {
                    setter(result); // slide image
                    return;
                }

                if (field === 'rightLogo') {
                    setter((prev: any) => {
                        const next = { ...(prev || {}), url: result };
                        void updateThemeSettings({ rightLogo: next });
                        return next;
                    });
                    return;
                }

                if (field === 'mobileLogo') {
                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, heroLogoUrl: result }));
                    setMobileThemeEnabled(true);
                    void updateMobileThemeSettings({ heroLogoUrl: result }, true);
                    return;
                }

                // default: left logo
                setter((prev: any) => {
                    const next = { ...(prev || {}), url: result };
                    void updateThemeSettings({ logo: next, logoUrl: result });
                    return next;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleThemeBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canUseAdvancedDesigns) {
            e.target.value = '';
            setUpgradeContactOpen(true);
            return;
        }

        const file = e.target.files?.[0];
        // Allow re-selecting the same file.
        e.target.value = '';
        if (!file) return;

        const optimizeToDataUrl = async (inputFile: File) => {
            // Fast-path: small images can be used as-is.
            // (Base64 adds overhead; still keep a modest threshold.)
            if (inputFile.size <= 1024 * 1024) {
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = () => reject(new Error('read_failed'));
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(inputFile);
                });
            }

            const objectUrl = URL.createObjectURL(inputFile);
            try {
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error('image_load_failed'));
                    image.src = objectUrl;
                });

                const maxW = 1920;
                const maxH = 1080;
                const ratio = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
                const targetW = Math.max(1, Math.round(img.naturalWidth * ratio));
                const targetH = Math.max(1, Math.round(img.naturalHeight * ratio));

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('canvas_ctx_failed');

                ctx.drawImage(img, 0, 0, targetW, targetH);

                // Prefer webp when available; fallback to jpeg.
                const quality = 0.85;
                let out = '';
                try {
                    out = canvas.toDataURL('image/webp', quality);
                    if (!out.startsWith('data:image/webp')) out = '';
                } catch {
                    out = '';
                }
                if (!out) {
                    out = canvas.toDataURL('image/jpeg', quality);
                }

                return out;
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };

        void (async () => {
            try {
                const result = await optimizeToDataUrl(file);
                const themeBackground = `url(${result})`;

                setSlides((prevSlides) =>
                    prevSlides.map((slide) => ({
                        ...slide,
                        background: themeBackground,
                    }))
                );

                await updateThemeSettings({
                    backgroundImage: result,
                    background: undefined,
                    backgroundColor: undefined,
                });
            } catch (err) {
                console.error('Görsel işleme hatası:', err);
            }
        })();
    };

    const handleMobileThemeBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canUseAdvancedDesigns) {
            e.target.value = '';
            setUpgradeContactOpen(true);
            return;
        }

        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const optimizeToDataUrl = async (inputFile: File) => {
            if (inputFile.size <= 1024 * 1024) {
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = () => reject(new Error('read_failed'));
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(inputFile);
                });
            }

            const objectUrl = URL.createObjectURL(inputFile);
            try {
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error('image_load_failed'));
                    image.src = objectUrl;
                });

                const maxW = 1920;
                const maxH = 1080;
                const ratio = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
                const targetW = Math.max(1, Math.round(img.naturalWidth * ratio));
                const targetH = Math.max(1, Math.round(img.naturalHeight * ratio));

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('canvas_ctx_failed');

                ctx.drawImage(img, 0, 0, targetW, targetH);

                const quality = 0.85;
                let out = '';
                try {
                    out = canvas.toDataURL('image/webp', quality);
                    if (!out.startsWith('data:image/webp')) out = '';
                } catch {
                    out = '';
                }
                if (!out) {
                    out = canvas.toDataURL('image/jpeg', quality);
                }

                return out;
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        };

        void (async () => {
            try {
                const result = await optimizeToDataUrl(file);
                await updateMobileThemeSettings({
                    style: null,
                    backgroundImage: result,
                    background: null,
                    backgroundColor: null,
                }, true);
            } catch (err) {
                console.error('Mobil görsel işleme hatası:', err);
            }
        })();
    };

    const persistThemeLayoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPersistedThemeLayoutRef = useRef<string>('');

    useEffect(() => {
        if (!eventData?.id) return;

        const snapshot = JSON.stringify({
            logo,
            rightLogo,
            qrPos,
        });
        if (snapshot === lastPersistedThemeLayoutRef.current) return;

        if (persistThemeLayoutTimerRef.current) clearTimeout(persistThemeLayoutTimerRef.current);
        persistThemeLayoutTimerRef.current = setTimeout(() => {
            lastPersistedThemeLayoutRef.current = snapshot;
            void updateThemeSettings({
                logo,
                rightLogo,
                qrPos,
                // Keep legacy field in sync for older consumers / fallbacks.
                logoUrl: (logo as any)?.url || null,
            });
        }, 450);

        return () => {
            if (persistThemeLayoutTimerRef.current) clearTimeout(persistThemeLayoutTimerRef.current);
        };
    }, [eventData?.id, logo, rightLogo, qrPos]);

    const handleStartPresentation = async () => {
        try {
            if (!eventData) return;

            // IMPORTANT: Open the popup synchronously to avoid browser popup blockers.
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;

            const screenHost = window.location.origin;

            const popupFeatures = `width=${screenWidth},height=${screenHeight},left=0,top=0,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`;
            const liveWindow = window.open('about:blank', '_blank', popupFeatures);

            // Update status to active
            await updateEvent(eventData.id, { status: 'active' });

            // Mark presentation as started
            setIsPresentationStarted(true);

            // Navigate the popup to the live screen
            if (liveWindow) {
                try {
                    liveWindow.location.href = `${screenHost}/events/${eventData.id}/live`;
                } catch {
                    // ignore
                }
            }

            // Try to make it fullscreen after opening
            if (liveWindow) {
                liveWindow.moveTo(0, 0);
                liveWindow.resizeTo(screenWidth, screenHeight);
            }

            // Redirect this page to moderator screen
            router.push(`/events/${eventData.id}`);
        } catch (error) {
            console.error("Failed to start presentation:", error);
            alert("Sunum başlatılamadı.");
        }
    };

    const handleStopPresentation = async () => {
        try {
            if (!eventData) return;
            await updateEvent(eventData.id, { status: 'draft' });
            setIsPresentationStarted(false);
        } catch (error) {
            console.error("Failed to stop presentation:", error);
        }
    };

    return (
        <>
        <style>{`
            html, body, #__next, .page-wrapper { background-color: #1a1b2e !important; color: #e2e8f0 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
            html::before, html::after, body::before, body::after { display: none !important; }
            .editor-root, .editor-root * { box-sizing: border-box; }
            .editor-root { width: 100vw !important; min-width: 0 !important; min-height: 100dvh !important; }
            .editor-header { background-color: #1e1f33 !important; border-bottom: 1px solid #2a2b45 !important; }
            .editor-toolbar { background-color: #252640 !important; border-bottom: 1px solid #2a2b45 !important; }
            .editor-left-panel { background-color: #1e1f33 !important; border-right: 1px solid #2a2b45 !important; }
            .editor-center { background-color: #2a2b45 !important; }
            /* Desktop: preview | right Özellikler paneli (yan yana). Dar ekranda alta yığılır. */
            .editor-main-grid {
                grid-template-columns: minmax(0, 1fr) minmax(300px, min(420px, 32vw)) !important;
                grid-template-rows: minmax(0, 1fr) !important;
            }
            .editor-settings-panel {
                border-top: none !important;
                border-left: 1px solid #2f3456 !important;
            }
            .light-panel {
                background: linear-gradient(180deg, #1f2238 0%, #1c1f34 100%) !important;
                border-left: 1px solid #2f3456 !important;
                color: #dbe4ff !important;
            }
            .light-panel * {
                border-color: #313758;
            }
            .light-panel [class~="text-black"],
            .light-panel [class*="text-[#2c3e50]"],
            .light-panel [class*="text-[#6b7280]"],
            .light-panel label,
            .light-panel span,
            .light-panel p {
                color: #dbe4ff !important;
            }
            .light-panel [class~="text-gray-700"],
            .light-panel [class~="text-gray-600"],
            .light-panel [class~="text-gray-500"] {
                color: #9ea8d9 !important;
            }
            /* Force dark bg on ALL buttons, then restore colored ones */
            .light-panel button {
                background-color: #1e2140 !important;
                color: #dbe4ff !important;
                border-color: #3a4063 !important;
            }
            .light-panel button[class*="bg-red-6"] { background-color: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; }
            .light-panel button[class*="bg-purple-6"] { background-color: #9333ea !important; color: #fff !important; border-color: #9333ea !important; }
            .light-panel button[class*="bg-emerald-6"] { background-color: #059669 !important; color: #fff !important; border-color: #059669 !important; }
            .light-panel button[class*="bg-indigo-6"] { background-color: #4f46e5 !important; color: #fff !important; border-color: #4f46e5 !important; }
            .light-panel button[class*="bg-green-5"] { background-color: #22c55e !important; color: #fff !important; border-color: #22c55e !important; }
            .light-panel button[class*="bg-amber-6"] { background-color: #d97706 !important; color: #fff !important; border-color: #d97706 !important; }
            /* Force dark bg on divs that act as containers */
            .light-panel div[class*="bg-white"] {
                background-color: #1e2140 !important;
            }
            .light-panel input,
            .light-panel select,
            .light-panel textarea {
                background: #181b2e !important;
                color: #f2f5ff !important;
                border-color: #3a4063 !important;
            }
            .light-panel input[readonly],
            .light-panel input[disabled] {
                background: #1a1d30 !important;
                color: #8e97bf !important;
            }
            .light-panel input::placeholder,
            .light-panel textarea::placeholder {
                color: #8e97bf !important;
            }
            .light-panel .bg-gray-100,
            .light-panel .bg-gray-50,
            .light-panel label[class*="bg-gray-1"] {
                background-color: #252840 !important;
            }
            .light-panel .hover\:bg-gray-200:hover,
            .light-panel label:hover {
                background-color: #353860 !important;
            }
            .light-panel .hover\:text-black:hover {
                color: #ffffff !important;
            }
            .light-panel .bg-amber-50 {
                background-color: #2a2518 !important;
            }
            .light-panel .border-amber-200,
            .light-panel .border-amber-300 {
                border-color: #5c4a1e !important;
            }
            .light-panel .text-amber-900,
            .light-panel .text-amber-800 {
                color: #fbbf24 !important;
            }
            .light-panel .hover\:border-indigo-400:hover,
            .light-panel .hover\:border-indigo-500:hover,
            .light-panel .hover\:border-red-500:hover,
            .light-panel .hover\:border-purple-500:hover {
                border-color: inherit;
            }
            @media (max-width: 1180px) {
                .editor-main-grid {
                    grid-template-columns: minmax(0, 1fr) !important;
                    grid-template-rows: minmax(0, 1fr) minmax(260px, 44vh) !important;
                }
                .editor-settings-panel {
                    border-top: 1px solid #2f3456 !important;
                    border-left: none !important;
                }
            }
        `}</style>
        <div className="editor-root h-screen flex flex-col overflow-hidden font-['Inter']" style={{ backgroundColor: '#1a1b2e', color: '#e2e8f0' }}>
            {/* 
        -----------------------------------------------------------------------
        HEADER - Eventimo-Style Top Menu Bar
        -----------------------------------------------------------------------
      */}
            <header className="editor-header shrink-0 z-50" style={{ backgroundColor: '#1e1f33', borderBottom: '1px solid #2a2b45' }}>
                {/* Row 1: Back + Event name + Save/Sunum */}
                <div className="h-[32px] flex items-center px-3 border-b border-[#2a2b45]">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-white transition-colors shrink-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Geri</span>
                    </button>
                    <span className="text-[14px] font-bold text-white ml-3 shrink-0">
                        {questionType === 'q-and-a' ? 'Etkinlik' : 'Quiz'}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => void updateThemeSettings({})}
                            className="flex items-center gap-1.5 px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-all"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>Kaydet</span>
                            <span className="text-[10px] text-emerald-200 ml-1">Ctrl+S</span>
                        </button>
                        {isPresentationStarted ? (
                            <button
                                onClick={handleStopPresentation}
                                className="flex items-center gap-1.5 px-4 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-all"
                            >
                                <Square className="w-3.5 h-3.5" />
                                <span>Durdur</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleStartPresentation}
                                className="flex items-center gap-1.5 px-4 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold transition-all"
                            >
                                <Play className="w-3.5 h-3.5" />
                                <span>Sunum</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: Tabs */}
                <div className="h-[30px] flex items-center px-3">
                    <nav className="flex items-center gap-0 h-full">
                        {([
                            { id: 'home' as const, label: 'Home' },
                            { id: 'design' as const, label: 'Tasarım' },
                            { id: 'question' as const, label: 'Soru' },
                        ]).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setTopMenuTab(item.id)}
                                className={`relative px-4 h-full text-[13px] font-medium transition-all ${
                                    topMenuTab === item.id
                                        ? 'text-white'
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {item.label}
                                {topMenuTab === item.id && (
                                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-indigo-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Second row: Ribbon toolbar */}
                {topMenuTab === 'home' && (
                    <div className="h-[82px] flex items-stretch border-t border-[#2a2b45]" style={{ backgroundColor: '#252640' }}>
                        {/* === PANO (Clipboard) section === */}
                        <div className="flex flex-col items-center border-r border-[#353a5a] px-2 py-1">
                            <button className="w-8 h-8 rounded hover:bg-[#303655] flex items-center justify-center text-[#9fa8cf]" title="Yapıştır">
                                <Clipboard className="w-[18px] h-[18px]" />
                            </button>
                            <span className="text-[9px] text-[#727da8] leading-tight">Yapıştır</span>
                            <div className="flex items-center gap-0.5 mt-auto">
                                <button className="w-5 h-5 rounded hover:bg-[#303655] flex items-center justify-center text-[#9fa8cf]" title="Kes">
                                    <Scissors className="w-3 h-3" />
                                </button>
                                <button className="w-5 h-5 rounded hover:bg-[#303655] flex items-center justify-center text-[#9fa8cf]" title="Kopyala">
                                    <Copy className="w-3 h-3" />
                                </button>
                                <button className="w-5 h-5 rounded hover:bg-[#303655] flex items-center justify-center text-[#9fa8cf]" title="Temizle">
                                    <Eraser className="w-3 h-3" />
                                </button>
                            </div>
                            <span className="text-[9px] text-[#727da8] leading-tight">Pano</span>
                        </div>

                        {/* === YAZI STILI (working design controls) === */}
                        <div className="w-[352px] bg-[#20233a] border-r border-[#353a5a] px-3 py-1.5 flex flex-col justify-between relative pb-4">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <select
                                    className="h-[28px] bg-[#171a2b] border border-[#3a3f63] rounded text-[12px] text-gray-100 px-1.5 outline-none focus:border-indigo-500 w-[138px]"
                                    value={currentSlide.style.fontFamily}
                                    onChange={(e) => {
                                        const fontFamily = e.target.value;
                                        updateSlide('style.fontFamily', fontFamily);
                                        void updateThemeSettings({ fontFamily });
                                    }}
                                    style={{ fontFamily: currentSlide.style.fontFamily }}
                                >
                                    {FONTS.map((f) => (
                                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="h-[28px] bg-[#171a2b] border border-[#3a3f63] rounded text-[12px] text-gray-100 px-1 outline-none focus:border-indigo-500 w-[56px]"
                                    value={currentSlide.style.fontSize}
                                    onChange={(e) => updateSlide('style.fontSize', Number(e.target.value))}
                                >
                                    {[24, 28, 32, 36, 40, 44, 48, 56, 64, 72].map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-1 ml-auto">
                                    {(['bold', 'italic', 'underline', 'shadow'] as const).map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            className={`w-[26px] h-[26px] rounded border border-[#3a3f63] flex items-center justify-center text-[12px] transition-all ${
                                                // @ts-ignore
                                                currentSlide.style[style]
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'text-[#dbe4ff] hover:bg-[#303655]'
                                            }`}
                                            // @ts-ignore
                                            onClick={() => updateSlide(`style.${style}`, !currentSlide.style[style])}
                                            title={style}
                                        >
                                            {style === 'bold' && <strong>B</strong>}
                                            {style === 'italic' && <em>I</em>}
                                            {style === 'underline' && <u>U</u>}
                                            {style === 'shadow' && <span style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>S</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    className="w-full h-[40px] px-3 border border-[#3a4063] rounded-lg bg-[#1e2140] flex items-center justify-between hover:border-indigo-500 transition-all"
                                    onClick={() => setHomeRibbonTextColorDropdownOpen(!homeRibbonTextColorDropdownOpen)}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-9 h-9 rounded border border-[#3a4063] shrink-0" style={{ background: currentSlide.style.color }} />
                                        <span className="text-left font-medium text-[12px] text-[#dbe4ff] truncate">Yazi rengi secin</span>
                                    </div>
                                    <ChevronDown className={`h-3 w-3 text-[#9ea8d9] transition-transform ${homeRibbonTextColorDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {homeRibbonTextColorDropdownOpen && (
                                    <div className="grid grid-cols-5 gap-2 p-2.5 bg-[#252640] border border-[#3a4063] rounded-lg shadow-lg absolute top-[calc(100%+6px)] left-0 right-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {TEXT_COLORS.map(color => (
                                            <div
                                                key={color}
                                                className={`aspect-square rounded-md border-2 cursor-pointer hover:scale-110 transition-transform ${selectedThemeTextColor === color ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-transparent'}`}
                                                style={{ background: color }}
                                                onClick={() => {
                                                    void handleTextColorPick(color);
                                                    setHomeRibbonTextColorDropdownOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[9px] text-[#727da8]">Yazi Tipi</span>
                        </div>

                        {/* === METİN (Sunum Başlığı) section === */}
                        <div className="w-[220px] bg-[#20233a] border-r border-[#353a5a] px-2.5 py-1.5 flex flex-col justify-center relative pb-4">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Type className="w-3.5 h-3.5 text-[#8f98c4]" />
                                <span className="text-[10px] text-[#8f98c4]">Sunum Başlığı</span>
                            </div>
                            <input
                                type="text"
                                value={presentationTitle}
                                onChange={(e) => setPresentationTitle(e.target.value)}
                                onBlur={() => void persistPresentationTitle(presentationTitle)}
                                placeholder="Sunum başlığını yazın..."
                                className="w-full h-[26px] bg-[#171a2b] border border-[#3a3f63] rounded px-2 text-[12px] text-gray-100 placeholder:text-[#6c759f] outline-none focus:border-indigo-500"
                            />
                            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[9px] text-[#727da8]">Metin</span>
                        </div>

                        {/* === Sunum Açıklaması section === */}
                        <div className="w-[260px] bg-[#20233a] border-r border-[#353a5a] px-2.5 py-1.5 flex flex-col justify-center relative pb-4">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Type className="w-3.5 h-3.5 text-[#8f98c4]" />
                                <span className="text-[10px] text-[#8f98c4]">Sunum Açıklaması</span>
                            </div>
                            <input
                                type="text"
                                value={presentationDescription}
                                onChange={(e) => setPresentationDescription(e.target.value)}
                                onBlur={() => void persistPresentationDescription(presentationDescription)}
                                placeholder="Kısa bir açıklama yazın..."
                                className="w-full h-[26px] bg-[#171a2b] border border-[#3a3f63] rounded px-2 text-[12px] text-gray-100 placeholder:text-[#6c759f] outline-none focus:border-indigo-500"
                            />
                            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[9px] text-[#727da8]">Açıklama</span>
                        </div>

                        {/* === DOLGU section (Renk 1/2 + Yok + opacity) === */}
                        <div className="bg-[#20233a] border-r border-[#353a5a] px-2.5 py-1.5 flex flex-col justify-between relative pb-4">
                            <div className="flex items-center gap-1.5">
                                <div className="flex h-[26px] bg-[#171a2b] border border-[#3a3f63] rounded overflow-hidden">
                                    <button className="px-2.5 text-[10px] text-white bg-[#3a3f63]">Renk 1</button>
                                    <button className="px-2.5 text-[10px] text-[#8f98c4] hover:bg-[#252a45]">Renk 2</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <select className="h-[26px] bg-[#171a2b] border border-[#3a3f63] rounded text-[10px] text-gray-100 px-1 outline-none w-[50px]">
                                    <option>Yok</option>
                                    <option>Düz</option>
                                    <option>Gradyan</option>
                                </select>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={70}
                                    readOnly
                                    className="w-[60px] accent-indigo-500 h-1"
                                />
                                <span className="text-[9px] text-[#8f98c4]">70%</span>
                            </div>
                            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[9px] text-[#727da8]">Dolgu</span>
                        </div>

                        {/* === HİZALAMA & BOYUT section (icons + sliders) === */}
                        <div className="bg-[#20233a] px-2.5 py-1.5 flex items-center gap-3 relative pb-4">
                            {/* Alignment icons */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                    <button className="w-[26px] h-[26px] rounded text-[#9fa8cf] hover:bg-[#303655] flex items-center justify-center">
                                        <AlignLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="w-[26px] h-[26px] rounded text-[#9fa8cf] hover:bg-[#303655] flex items-center justify-center">
                                        <AlignCenter className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="w-[26px] h-[26px] rounded text-[#9fa8cf] hover:bg-[#303655] flex items-center justify-center">
                                        <AlignRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {/* Y / W sliders */}
                            <div className="flex flex-col gap-1 min-w-[140px]">
                                <div className="flex items-center gap-1.5 text-[10px] text-[#8f98c4]">
                                    <span className="w-3 text-right">Y</span>
                                    <input type="range" min={0} max={100} value={18} readOnly className="flex-1 accent-indigo-500 h-1" />
                                    <span className="w-7 text-right">18%</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#8f98c4]">
                                    <span className="w-3 text-right">W</span>
                                    <input type="range" min={0} max={100} value={90} readOnly className="flex-1 accent-indigo-500 h-1" />
                                    <span className="w-7 text-right">90%</span>
                                </div>
                            </div>
                            <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[9px] text-[#727da8]">Hizalama & Boyut</span>
                        </div>
                    </div>
                )}
                {topMenuTab !== 'home' && (
                    <div className={`${topMenuTab === 'design' ? 'min-h-[112px] py-2 items-start' : 'h-[40px] items-center'} flex px-3 border-t border-[#2a2b45]`} style={{ backgroundColor: '#252640' }}>
                        {topMenuTab === 'design' && (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-3 flex-wrap w-full">
                                    <span className="text-[12px] font-medium text-[#9ea8d9] shrink-0">Tema Kategorisi</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {visibleThemeCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => setActiveThemeCategory(category.id)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeThemeCategory === category.id
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-[#303655] hover:bg-[#3a3f63] text-[#dbe4ff]'
                                                    }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full overflow-x-auto pb-1">
                                    <div className="flex gap-2 min-w-max pr-2">
                                        {(visibleThemeCategories.find((c) => c.id === activeThemeCategory)?.themes || []).map((theme) => {
                                            const hasBackground = 'background' in theme && theme.background;
                                            const isImageBackground = hasBackground && isImageValue(theme.background);
                                            const isSelected = currentSlide.style && (eventData as any)?.settings?.theme?.style === theme.id;

                                            return (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => applyTheme(theme)}
                                                    className={`relative w-[126px] h-[72px] rounded-lg overflow-hidden border-2 transition-all shrink-0 ${isSelected ? 'border-red-500 ring-2 ring-red-300' : 'border-[#3a4063] hover:border-red-400'}`}
                                                >
                                                    {isImageBackground ? (
                                                        <div
                                                            className="absolute inset-0 bg-cover bg-center"
                                                            style={{ backgroundImage: `url(${theme.background})` }}
                                                        />
                                                    ) : hasBackground ? (
                                                        <div className="absolute inset-0" style={{ background: theme.background }} />
                                                    ) : (
                                                        <div className="absolute inset-0" style={{ backgroundColor: (theme as any).backgroundColor || theme.primaryColor }} />
                                                    )}

                                                    <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/75 to-transparent">
                                                        <span className="text-white text-[10px] font-semibold leading-none">{theme.name}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        {topMenuTab === 'question' && (
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] text-gray-400">Soru ayarları sağ panelde.</span>
                                <button
                                    onClick={() => setActiveTab('properties')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3b3c5a] text-white text-[12px] font-medium hover:bg-[#4b4c6a] transition-all"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    Özellikler Panelini Aç
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* 
        -----------------------------------------------------------------------
        MAIN CONTAINER (3-column: left slides + center preview + right sidebar)
        -----------------------------------------------------------------------
      */}
            <div className="flex flex-1 overflow-hidden min-w-0">

                {/* CENTER + RIGHT in grid */}
                <div className="editor-main-grid grid flex-1 overflow-hidden min-w-0 min-h-0">

                {/* CENTER - EDITOR AREA */}
                <div className="editor-center p-2 flex flex-col items-center gap-2 overflow-auto" style={{ backgroundColor: '#2a2b45' }}>
                    <div className="flex-1" />

                    {/* Slide counter top line */}
                    <div className="w-full max-w-full flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setLivePreviewView('join')} className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${livePreviewView === 'join' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#3a3b55] hover:text-white'}`}>Giriş</button>
                            <button type="button" onClick={() => { setLivePreviewView('wall'); void persistScreenMode('wall'); }} className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${livePreviewView === 'wall' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#3a3b55] hover:text-white'}`}>Duvar</button>
                            <button type="button" onClick={() => { setLivePreviewView('rotate'); void persistScreenMode('rotate'); }} className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${livePreviewView === 'rotate' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#3a3b55] hover:text-white'}`}>Tek tek</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">Soru {currentSlideIndex + 1}/{slides.length}</span>
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[11px] text-gray-500">0</span>
                        </div>
                    </div>

                    {centerLivePreview ? (
                        <div className="w-full max-w-[95%] grid grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
                            <div>
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Ana Ekran</div>
                                <div className="w-full aspect-video rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden">
                                    <ScaledIframe
                                        title="Canlı ekran önizleme (merkez)"
                                        src={`/events/${eventId}/live?view=${livePreviewView}&embed=1&hideEditorLogos=1&v=${livePreviewNonce}`}
                                        iframeRef={livePreviewIframeRef}
                                        onScaleChange={setLivePreviewScale}
                                        overlay={interactivePreviewOverlay}
                                    />
                                    {logo.url ? (
                                        <div className="absolute top-2 left-2 z-[90] px-2.5 py-1 rounded-md bg-black/55 text-white text-[11px] font-medium backdrop-blur-sm pointer-events-none">
                                            Logo: sürükle taşı, köşeden veya tekerlekle boyutlandır
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Mobil</div>
                                <div className="w-full aspect-[390/844] rounded-[28px] border border-white/10 bg-[#181a2f] shadow-[0_8px_30px_rgba(0,0,0,0.22)] relative overflow-hidden">
                                    <ScaledIframe
                                        title="Mobil ekran önizleme"
                                        src={mobilePreviewSrc}
                                        iframeRef={mobilePreviewIframeRef}
                                        baseWidth={MOBILE_PREVIEW_W}
                                        baseHeight={MOBILE_PREVIEW_H}
                                        overlay={<div className="absolute inset-0 z-10" />}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="w-full max-w-[90%] aspect-video rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center justify-center p-[60px] text-center transition-all duration-400 bg-cover bg-center"
                            style={{
                                background: normalizeBackgroundValue(currentSlide.background).startsWith('url(')
                                    ? undefined
                                    : normalizeBackgroundValue(currentSlide.background),
                                backgroundImage: normalizeBackgroundValue(currentSlide.background).startsWith('url(')
                                    ? normalizeBackgroundValue(currentSlide.background)
                                    : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            {/* Instructions Bar Overlay */}
                            {showInstructions && (
                                <div className="absolute top-0 left-0 right-0 bg-black/80 text-white py-4 px-6 flex items-center justify-center text-lg font-medium backdrop-blur-md z-10 transition-all">
                                    <>
                                        <span>Şu adrese gidin: </span>
                                        <strong className="mx-2 text-[22px]">{hostName}</strong>
                                        <span> | Kod: </span>
                                        <strong className="mx-2 text-[22px]">{resolvedEventPin || '...'}</strong>
                                        <span> veya QR kodu taratın</span>
                                    </>
                                </div>
                            )}

                            {/* QR Code Container */}
                            {showQR && (
                                <div
                                    className="absolute bg-white p-3 rounded-xl shadow-lg z-10 transition-all duration-300 flex flex-col items-center gap-2"
                                    style={{
                                        left: `${qrPos.x}px`,
                                        bottom: `${qrPos.y}px`
                                    }}
                                >
                                    {eventData ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={qrCodeUrl || eventData.qrCodeUrl || ''} className="w-[140px] h-[140px] mix-blend-multiply" alt="Event QR" />
                                            <div className="text-center pt-1 border-t border-gray-100 w-full mt-1">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Kod</p>
                                                <p className="text-2xl font-black text-gray-900 tracking-widest leading-none mt-0.5">{resolvedEventPin || '...'}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-[140px] h-[140px] bg-gray-200 animate-pulse" />
                                    )}
                                </div>
                            )}

                            {/* Stats Counter */}
                            <div
                                className={`absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-5 py-3 rounded-[20px] shadow-lg flex items-center gap-5 z-10 ${showStats ? 'flex' : 'hidden'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">👥</span>
                                    <span className="text-xl font-bold text-[#2c3e50] min-w-[30px] text-center">0</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">💬</span>
                                    <span className="text-xl font-bold text-[#2c3e50] min-w-[30px] text-center">0</span>
                                </div>
                            </div>

                            {/* Logos */}
                            {logo.url && (
                                <img
                                    src={logo.url}
                                    className="absolute z-10 object-contain"
                                    style={{
                                        width: `${logo.size}px`,
                                        transform: `translate(${logo.x}px, ${logo.y}px)`
                                    }}
                                />
                            )}
                            {rightLogo.url && (
                                <img
                                    src={rightLogo.url}
                                    className="absolute z-10 object-contain"
                                    style={{
                                        width: `${rightLogo.size}px`,
                                        [rightLogo.anchor === 'top-right' ? 'top' : 'bottom']: '24px',
                                        right: '24px',
                                        transform: `translate(${rightLogo.x}px, ${rightLogo.y}px)`
                                    }}
                                />
                            )}

                            {/* Main Content */}
                            <div className="w-full h-full flex flex-col justify-center items-center z-0">
                                {currentSlide.image && (
                                    <img src={currentSlide.image} className="max-w-[60%] max-h-[40%] rounded-xl shadow-2xl mb-4 object-contain" />
                                )}

                                {/* Başlık - arkasında blur efekti */}
                                <div
                                    className="px-8 py-4 rounded-2xl bg-black/30 backdrop-blur-md"
                                    style={{
                                        transform: `translate(${currentSlide.style.headingX}px, ${currentSlide.style.headingY}px)`
                                    }}
                                >
                                    <textarea
                                        className="w-full bg-transparent border-none text-center resize-none focus:outline-none placeholder-white/50 overflow-hidden"
                                        style={{
                                            fontFamily: currentSlide.style.fontFamily,
                                            fontSize: `${currentSlide.style.fontSize}px`,
                                            color: currentSlide.style.color,
                                            fontWeight: currentSlide.style.bold ? 'bold' : 'normal',
                                            fontStyle: currentSlide.style.italic ? 'italic' : 'normal',
                                            textDecoration: currentSlide.style.underline ? 'underline' : 'none',
                                            textShadow: currentSlide.style.shadow ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
                                        }}
                                        value={currentSlide.question}
                                        onChange={(e) => updateSlide('question', e.target.value)}
                                        placeholder="Başlık metnini buraya yazın..."
                                        rows={2}
                                    />
                                </div>

                                <div className="w-full max-w-[800px] mt-8 p-5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-center">
                                    <div className="text-white/50 text-xl italic font-light">
                                        Gelen sorular burada görünecek
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Bottom navigation - Eventimo style */}
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            type="button"
                            className="w-7 h-7 rounded bg-[#3a3b55] hover:bg-[#4b4c6a] flex items-center justify-center transition-all"
                            onClick={() => setCurrentSlideIndex((i) => (slides.length ? (i - 1 + slides.length) % slides.length : 0))}
                        >
                            <ArrowLeft className="w-3.5 h-3.5 text-gray-300" />
                        </button>
                        <span className="text-[12px] text-gray-400 font-medium">{currentSlideIndex + 1} / {slides.length}</span>
                        <button
                            type="button"
                            className="w-7 h-7 rounded bg-[#3a3b55] hover:bg-[#4b4c6a] flex items-center justify-center transition-all"
                            onClick={() => setCurrentSlideIndex((i) => (slides.length ? (i + 1) % slides.length : 0))}
                        >
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                        </button>
                    </div>
                    <div className="flex-1" />
                </div>

                {/* RIGHT SIDEBAR - SETTINGS */}
                <div className="editor-settings-panel light-panel bg-[#1f2238] flex min-h-0 flex-col overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
                        <TabsList className="flex bg-transparent w-full h-[36px] border-b border-[#313758] px-2 gap-0 shrink-0">
                            <TabsTrigger value="properties" className="flex items-center gap-1.5 px-3 h-full text-[13px] font-medium text-[#9ea8d9] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none transition-all">
                                <Settings className="h-3.5 w-3.5" />
                                <span>Özellikler</span>
                            </TabsTrigger>
                            <TabsTrigger value="design" className="flex items-center gap-1.5 px-3 h-full text-[13px] font-medium text-[#9ea8d9] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none transition-all">
                                <Palette className="h-3.5 w-3.5" />
                                <span>Tasarım</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent ref={propertiesTabRef} value="properties" className="m-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-4 space-y-0 animate-in slide-in-from-right-4 duration-300">

                            {/* SEÇENEKLER Section */}
                            {/* SEÇENEKLER Section - Eventimo style */}
                            <CollapsibleSection title="SEÇENEKLER">
                                {questionType === 'multiple_choice' || questionType === 'true_false' ? (
                                    <div className="space-y-3">
                                        {(questionType === 'true_false'
                                            ? [{ id: 'A', text: 'Doğru', color: '#22C55E' }, { id: 'B', text: 'Yanlış', color: '#EF4444' }]
                                            : options
                                        ).map((opt, idx) => (
                                            <div key={opt.id} className="flex items-center gap-2">
                                                {/* Radio / correct answer selector */}
                                                <button
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        correctAnswer === opt.id
                                                            ? 'border-green-500 bg-green-500'
                                                            : 'border-[#dfe1e6] hover:border-green-400'
                                                    }`}
                                                    onClick={() => setCorrectAnswer(correctAnswer === opt.id ? null : opt.id)}
                                                    title="Doğru cevap olarak işaretle"
                                                >
                                                    {correctAnswer === opt.id && <Check className="w-3 h-3 text-white" />}
                                                </button>
                                                {/* Letter badge with option color */}
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: opt.color }}>
                                                    {opt.id}
                                                </div>
                                                {/* Color picker per option */}
                                                <input
                                                    type="color"
                                                    value={opt.color}
                                                    onChange={(e) => {
                                                        const newOpts = [...options];
                                                        newOpts[idx] = { ...newOpts[idx], color: e.target.value };
                                                        setOptions(newOpts);
                                                    }}
                                                    className="w-7 h-7 rounded-md border border-[#dfe1e6] cursor-pointer bg-transparent flex-shrink-0"
                                                    title="Seçenek rengi"
                                                />
                                                {/* Text input */}
                                                <input
                                                    className="flex-1 p-2 border border-[#dfe1e6] rounded-md text-sm bg-white focus:border-indigo-500 outline-none transition-all"
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOpts = [...options];
                                                        newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                                                        setOptions(newOpts);
                                                    }}
                                                    placeholder={`Seçenek ${opt.id}`}
                                                    readOnly={questionType === 'true_false'}
                                                />
                                                {/* Delete option button */}
                                                {questionType !== 'true_false' && options.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                                        className="w-6 h-6 rounded text-gray-400 hover:text-red-500 flex items-center justify-center flex-shrink-0 transition-colors"
                                                        title="Seçeneği sil"
                                                    >
                                                        −
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {questionType === 'multiple_choice' && options.length < 6 && (
                                            <button
                                                className="w-full py-2 border border-dashed border-[#dfe1e6] rounded-md text-xs text-[#6b7280] hover:border-indigo-400 hover:text-indigo-500 transition-all"
                                                onClick={() => {
                                                    const nextId = String.fromCharCode(65 + options.length);
                                                    const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                                                    setOptions([...options, { id: nextId, text: `Seçenek ${nextId}`, color: colors[options.length] || '#6B7280' }]);
                                                }}
                                            >
                                                + Seçenek Ekle
                                            </button>
                                        )}
                                    </div>
                                ) : null}

                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-black mb-2 block">Duvar / Tek tek Başlıkları</label>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-black mb-1.5 block">Duvar Başlığı</label>
                                        <input
                                            className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg text-sm text-black placeholder:text-black focus:border-[#667eea] outline-none transition-all"
                                            value={wallHeadingTitle}
                                            onChange={(e) => setWallHeadingTitle(e.target.value)}
                                            onBlur={() => void persistLiveHeadings({
                                                wallTitle: wallHeadingTitle,
                                                wallSubtitle: wallHeadingSubtitle,
                                                rotateTitle: rotateHeadingTitle,
                                                rotateSubtitle: rotateHeadingSubtitle,
                                            })}
                                            placeholder="Duvar başlığını yazın"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-black mb-1.5 block">Duvar Açıklaması</label>
                                        <input
                                            className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg text-sm text-black placeholder:text-black focus:border-[#667eea] outline-none transition-all"
                                            value={wallHeadingSubtitle}
                                            onChange={(e) => setWallHeadingSubtitle(e.target.value)}
                                            onBlur={() => void persistLiveHeadings({
                                                wallTitle: wallHeadingTitle,
                                                wallSubtitle: wallHeadingSubtitle,
                                                rotateTitle: rotateHeadingTitle,
                                                rotateSubtitle: rotateHeadingSubtitle,
                                            })}
                                            placeholder="Yeni sorular otomatik eklenir."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-black mb-1.5 block">Tek tek Başlığı</label>
                                        <input
                                            className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg text-sm text-black placeholder:text-black focus:border-[#667eea] outline-none transition-all"
                                            value={rotateHeadingTitle}
                                            onChange={(e) => setRotateHeadingTitle(e.target.value)}
                                            onBlur={() => void persistLiveHeadings({
                                                wallTitle: wallHeadingTitle,
                                                wallSubtitle: wallHeadingSubtitle,
                                                rotateTitle: rotateHeadingTitle,
                                                rotateSubtitle: rotateHeadingSubtitle,
                                            })}
                                            placeholder="Tek tek başlığını yazın"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-black mb-1.5 block">Tek tek Açıklaması</label>
                                        <input
                                            className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg text-sm text-black placeholder:text-black focus:border-[#667eea] outline-none transition-all"
                                            value={rotateHeadingSubtitle}
                                            onChange={(e) => setRotateHeadingSubtitle(e.target.value)}
                                            onBlur={() => void persistLiveHeadings({
                                                wallTitle: wallHeadingTitle,
                                                wallSubtitle: wallHeadingSubtitle,
                                                rotateTitle: rotateHeadingTitle,
                                                rotateSubtitle: rotateHeadingSubtitle,
                                            })}
                                            placeholder="Sorular sırayla gösterilir."
                                        />
                                    </div>
                                </div>
                            </div>
                            </CollapsibleSection>

                            {/* Katılım Talimatları */}
                            <CollapsibleSection title="KATILIM TALİMATLARI">
                            <div className="mb-4 mt-2">
                                <div className="space-y-3">
                                    {[
                                        { key: 'showInstructions', label: 'Talimat çubuğunu göster', val: showInstructions, set: setShowInstructions },
                                        { key: 'showQR', label: 'QR kodu göster', val: showQR, set: setShowQR },
                                        { key: 'showStats', label: 'Katılımcı bilgisi göster', val: showStats, set: setShowStats },
                                        { key: 'showNames', label: 'Katılımcı isimlerini göster', val: showNames, set: setShowNames },
                                        { key: 'bgAnimation', label: 'Arka plan animasyonu', val: bgAnimation, set: setBgAnimation },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-sm text-[#2c3e50]">{item.label}</span>
                                            <Switch
                                                checked={item.val}
                                                onCheckedChange={(next) => {
                                                    const nextPatch: Record<string, any> = { [item.key]: next };
                                                    if (item.key === 'bgAnimation' && next) {
                                                        const nextStart = gradientColorStart || DEFAULT_GRADIENT_ANIMATION_START;
                                                        const nextEnd = gradientColorEnd || DEFAULT_GRADIENT_ANIMATION_END;
                                                        setBgAnimationType('gradient');
                                                        setGradientColorStart(nextStart);
                                                        setGradientColorEnd(nextEnd);
                                                        nextPatch.bgAnimationType = 'gradient';
                                                        nextPatch.gradientColorStart = nextStart;
                                                        nextPatch.gradientColorEnd = nextEnd;
                                                    }
                                                    item.set(next);
                                                    void updateThemeSettings(nextPatch);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Animation type selector */}
                                {bgAnimation && (
                                    <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                                        <span className="text-xs font-medium text-[#64748b] mb-2 block">Animasyon tipi</span>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {([
                                                { value: 'gradient', label: 'Gradient', icon: '🌈' },
                                                { value: 'waves', label: 'Dalgalar', icon: '🌊' },
                                                { value: 'aurora', label: 'Aurora', icon: '✨' },
                                                { value: 'mesh', label: 'Mesh', icon: '🔮' },
                                                { value: 'shapes', label: 'Shapes', icon: '🔷' },
                                                { value: 'paths', label: 'Paths', icon: '〰️' },
                                                { value: 'vortex', label: 'Vortex', icon: '🌀' },
                                                { value: 'dots', label: 'Dots', icon: '⭐' },
                                                { value: 'beams', label: 'Beams', icon: '💫' },
                                                { value: 'shadow', label: 'Shadow', icon: '👻' },
                                                { value: 'smoke', label: 'Smoke', icon: '💨' },
                                                { value: 'flow', label: 'Flow', icon: '🎨' },
                                                { value: 'rain', label: 'Rain', icon: '🌧️' },
                                                { value: 'gdots', label: 'GDots', icon: '🔵' },
                                                { value: 'wave2', label: 'Wave2', icon: '🌊' },
                                                { value: 'mShader', label: 'MeshSh', icon: '🎆' },
                                                { value: 'infGrid', label: 'Grid', icon: '🔲' },
                                                { value: 'warp', label: 'Warp', icon: '🌀' },
                                                { value: 'silk', label: 'Silk', icon: '🧶' },
                                                { value: 'sHero', label: 'Nebula', icon: '🌌' },
                                                { value: 'rings', label: 'Rings', icon: '💿' },
                                                { value: 'eBeams', label: 'EBeams', icon: '🔦' },
                                                { value: 'pPhys', label: 'Particle', icon: '⚛️' },
                                                { value: 'hills', label: 'Hills', icon: '⛰️' },
                                                { value: 'paper', label: 'Paper', icon: '📄' },
                                            ] as const).map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setBgAnimationType(opt.value);
                                                        void updateThemeSettings({ bgAnimationType: opt.value } as any);
                                                    }}
                                                    className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                                        bgAnimationType === opt.value
                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                                                            : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]'
                                                    }`}
                                                >
                                                    <span className="text-lg">{opt.icon}</span>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {bgAnimationType === 'gradient' && (
                                            <div className="mt-3">
                                                <span className="text-xs font-medium text-[#64748b] mb-2 block">Gradient renkleri</span>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <label className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#475569]">
                                                        <span className="mb-2 block">Başlangıç</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={gradientColorStart}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setGradientColorStart(nextValue);
                                                                    void updateThemeSettings({ gradientColorStart: nextValue } as any);
                                                                }}
                                                                className="h-9 w-12 cursor-pointer rounded border border-[#cbd5e1] bg-transparent"
                                                            />
                                                            <span className="font-mono text-[11px] uppercase text-[#64748b]">{gradientColorStart}</span>
                                                        </div>
                                                    </label>
                                                    <label className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#475569]">
                                                        <span className="mb-2 block">Bitiş</span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={gradientColorEnd}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setGradientColorEnd(nextValue);
                                                                    void updateThemeSettings({ gradientColorEnd: nextValue } as any);
                                                                }}
                                                                className="h-9 w-12 cursor-pointer rounded border border-[#cbd5e1] bg-transparent"
                                                            />
                                                            <span className="font-mono text-[11px] uppercase text-[#64748b]">{gradientColorEnd}</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Aurora color preset selector */}
                                        {bgAnimationType === 'aurora' && (
                                            <div className="mt-3">
                                                <span className="text-xs font-medium text-[#64748b] mb-2 block">Aurora rengi</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries((
                                                        { blue: { label: 'Mavi', c: '#3b82f6' }, green: { label: 'Yeşil', c: '#22c55e' }, red: { label: 'Kırmızı', c: '#ef4444' }, purple: { label: 'Mor', c: '#a855f7' }, pink: { label: 'Pembe', c: '#ec4899' }, cyan: { label: 'Camgöbeği', c: '#06b6d4' }, orange: { label: 'Turuncu', c: '#f97316' } }
                                                    ) as Record<string, { label: string; c: string }>).map(([key, { label, c }]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            title={label}
                                                            onClick={() => {
                                                                setAuroraColorPreset(key);
                                                                void updateThemeSettings({ auroraColorPreset: key } as any);
                                                            }}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                                auroraColorPreset === key
                                                                    ? 'border-white ring-2 ring-indigo-500 scale-110'
                                                                    : 'border-transparent hover:scale-105'
                                                            }`}
                                                            style={{ background: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            </CollapsibleSection>

                            {/* GENEL Section */}
                            <CollapsibleSection title="GENEL" defaultOpen={false}>

                            {/* Logos */}
                            <div className="mb-6 pt-6 border-t border-[#e2e8f0]">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[13px] font-semibold text-black block">Sunum Logosu</label>
                                    {!canUseBrandingLogos && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                                <Lock className="h-3 w-3" /> Branding
                                            </span>
                                        )}
                                    </div>

                                {!canUseBrandingLogos ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <div className="text-sm font-semibold text-amber-900">Logo ekleme full branding ozelligi</div>
                                        <div className="text-xs text-amber-800 mt-1">Sadece full branding dahil paketlerde sunuma ozel logo ekleyebilir ve konum/boyut ayarlayabilirsiniz.</div>

                                        {(logo.url || rightLogo.url) && (
                                            <div className="mt-3 text-xs text-amber-900">
                                                <div className="font-semibold">Mevcut logolar</div>
                                                <div className="mt-2 flex gap-2">
                                                    {logo.url && (
                                                        <button
                                                            className="px-3 py-2 rounded-md border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                                                            onClick={() => {
                                                                setLogo((prev) => ({ ...prev, url: null }));
                                                                void updateThemeSettings({ logo: { ...logo, url: null }, logoUrl: null });
                                                            }}
                                                        >
                                                            Sol Logoyu Kaldır
                                                        </button>
                                                    )}
                                                    {rightLogo.url && (
                                                        <button
                                                            className="px-3 py-2 rounded-md border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                                                            onClick={() => {
                                                                setRightLogo((prev) => ({ ...prev, url: null }));
                                                                void updateThemeSettings({ rightLogo: { ...rightLogo, url: null } });
                                                            }}
                                                        >
                                                            Sağ Logoyu Kaldır
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
                                                onClick={() => setUpgradeContactOpen(true)}
                                            >
                                                Paket Yukselt
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2 mb-3">
                                            <button className="flex-1 bg-white border border-[#dfe1e6] rounded-md py-2 text-sm font-medium hover:bg-[#f5f7fa]" onClick={() => logoInputRef.current?.click()}>
                                                📷 Logo Yükle
                                            </button>
                                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo as any, 'logo')} />
                                            {logo.url && (
                                                <button
                                                    className="px-3 rounded-md border transition-colors hover:opacity-90"
                                                    style={{
                                                        color: uiPrimaryHex,
                                                        borderColor: toRgbaFromHex(uiPrimaryHex, 0.25, '#fecaca'),
                                                        backgroundColor: toRgbaFromHex(uiPrimaryHex, 0.08, '#fef2f2'),
                                                    }}
                                                    onClick={() => {
                                                        setLogo((prev) => ({ ...prev, url: null }));
                                                        void updateThemeSettings({ logo: { ...logo, url: null }, logoUrl: null });
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                        {logo.url && (
                                            <div
                                                className="space-y-3 pl-2 border-l-2 border-[#e2e8f0]"
                                                style={{ ['--primary' as any]: uiPrimaryHslVar }}
                                            >
                                                <div>
                                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                                        <span className="text-black">Boyut</span>
                                                        <span style={{ color: uiPrimaryHex }}>{logo.size}px</span>
                                                    </div>
                                                    <Slider min={60} max={800} value={[logo.size]} onValueChange={(val) => setLogo(prev => ({ ...prev, size: val[0] }))} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-xs text-black block mb-1">X Konum</span>
                                                        <Slider min={-400} max={400} value={[logo.x]} onValueChange={(val) => setLogo(prev => ({ ...prev, x: val[0] }))} />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-black block mb-1">Y Konum</span>
                                                        <Slider min={-200} max={600} value={[logo.y]} onValueChange={(val) => setLogo(prev => ({ ...prev, y: val[0] }))} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 pt-1">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-4 h-4 rounded accent-indigo-500" checked={!!logo.shadow} onChange={(e) => { const next = { ...logo, shadow: e.target.checked }; setLogo(next); void updateThemeSettings({ logo: next }); }} />
                                                        <span className="text-xs font-medium text-black">Gölge</span>
                                                    </label>
                                                    {logo.shadow && (
                                                        <input type="color" className="w-6 h-6 rounded cursor-pointer border border-gray-300" value={logo.shadowColor || '#ffffff'} onChange={(e) => { const next = { ...logo, shadowColor: e.target.value }; setLogo(next); void updateThemeSettings({ logo: next }); }} title="Gölge rengi" />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-dashed border-[#e2e8f0]">
                                            <label className="text-[13px] font-semibold text-black mb-3 block">Mobil Logo</label>
                                            <div className="flex gap-2 mb-3">
                                                <button className="flex-1 bg-white border border-[#dfe1e6] rounded-md py-2 text-sm font-medium hover:bg-[#f5f7fa]" onClick={() => rightLogoInputRef.current?.click()}>
                                                    📷 Mobil Logo Yükle
                                                </button>
                                                <input type="file" ref={rightLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setRightLogo as any, 'rightLogo')} />
                                                {rightLogo.url && (
                                                    <button
                                                        className="px-3 rounded-md border transition-colors hover:opacity-90"
                                                        style={{
                                                            color: uiPrimaryHex,
                                                            borderColor: toRgbaFromHex(uiPrimaryHex, 0.25, '#fecaca'),
                                                            backgroundColor: toRgbaFromHex(uiPrimaryHex, 0.08, '#fef2f2'),
                                                        }}
                                                        onClick={() => {
                                                            setRightLogo((prev) => ({ ...prev, url: null }));
                                                            void updateThemeSettings({ rightLogo: { ...rightLogo, url: null } });
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                            {rightLogo.url && (
                                                <div className="flex items-center gap-3 mb-3 pl-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-4 h-4 rounded accent-indigo-500" checked={!!rightLogo.shadow} onChange={(e) => { const next = { ...rightLogo, shadow: e.target.checked }; setRightLogo(next); void updateThemeSettings({ rightLogo: next }); }} />
                                                        <span className="text-xs font-medium text-black">Gölge</span>
                                                    </label>
                                                    {rightLogo.shadow && (
                                                        <input type="color" className="w-6 h-6 rounded cursor-pointer border border-gray-300" value={rightLogo.shadowColor || '#ffffff'} onChange={(e) => { const next = { ...rightLogo, shadowColor: e.target.value }; setRightLogo(next); void updateThemeSettings({ rightLogo: next }); }} title="Gölge rengi" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* QR Position */}
                            <div className="mb-6 pt-6 border-t border-[#e2e8f0]">
                                <label className="text-[13px] font-semibold text-black mb-3 block">QR Kod Konumu</label>
                                <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-[#e2e8f0]">
                                    <div>
                                        <div className="flex justify-between text-xs text-[#667eea] font-semibold mb-1"><span className="text-black">QR X (Sol)</span></div>
                                        <Slider min={0} max={1820} value={[qrPos.x]} onValueChange={(val) => setQrPos(prev => ({ ...prev, x: val[0] }))} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-[#667eea] font-semibold mb-1"><span className="text-black">QR Y (Alt)</span></div>
                                        <Slider min={0} max={1040} value={[qrPos.y]} onValueChange={(val) => setQrPos(prev => ({ ...prev, y: val[0] }))} />
                                    </div>
                                </div>
                            </div>
                            </CollapsibleSection>

                        </TabsContent>

                        <TabsContent ref={designTabRef} value="design" className="m-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-5 pr-2">

                                <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDesignPanelView('main')}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${designPanelView === 'main'
                                                ? 'bg-white text-[#111827] shadow-sm border border-[#d1d5db]'
                                                : 'text-[#6b7280] hover:bg-white/70'
                                                }`}
                                        >
                                            Ana Ekran
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDesignPanelView('mobile')}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${designPanelView === 'mobile'
                                                ? 'bg-white text-[#111827] shadow-sm border border-[#d1d5db]'
                                                : 'text-[#6b7280] hover:bg-white/70'
                                                }`}
                                        >
                                            Mobil Katılım
                                        </button>
                                    </div>
                                </div>

                                {designPanelView === 'main' ? (
                                    <>
                                        <div className="pb-4 border-b border-[#eef2f7]">
                                            <label className="text-[13px] font-semibold text-black mb-3 block">Ekran görünümü</label>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-xs text-black">{hostName || 'aktif-host'}</div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => persistScreenMode('wall')}
                                                        className={
                                                            'px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ' +
                                                            (screenMode === 'wall'
                                                                ? 'bg-purple-600 text-white border-purple-600'
                                                                : 'bg-white text-[#2c3e50] border-[#dfe1e6] hover:border-purple-500')
                                                        }
                                                        title="Instagram duvarı"
                                                    >
                                                        Duvar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => persistScreenMode('rotate')}
                                                        className={
                                                            'px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ' +
                                                            (screenMode === 'rotate'
                                                                ? 'bg-purple-600 text-white border-purple-600'
                                                                : 'bg-white text-[#2c3e50] border-[#dfe1e6] hover:border-purple-500')
                                                        }
                                                        title="Sorular tek tek dönsün"
                                                    >
                                                        Tek tek
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <label className="text-[13px] font-semibold text-black block">Tema Kategorisi</label>
                                                {!canUseAdvancedDesigns && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                                        <Lock className="h-3 w-3" /> Full Branding
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {visibleThemeCategories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => setActiveThemeCategory(category.id)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeThemeCategory === category.id
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                            }`}
                                                    >
                                                        {category.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[13px] font-semibold text-black block mb-2">
                                                {visibleThemeCategories.find((c) => c.id === activeThemeCategory)?.name || 'Temalar'}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(visibleThemeCategories.find((c) => c.id === activeThemeCategory)?.themes || []).map((theme) => {
                                                    const hasBackground = 'background' in theme && theme.background;
                                                    const isImageBackground = hasBackground && isImageValue(theme.background);
                                                    const isSelected = (eventData as any)?.settings?.theme?.style === theme.id;

                                                    return (
                                                        <button
                                                            key={theme.id}
                                                            type="button"
                                                            onClick={() => applyTheme(theme)}
                                                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${isSelected ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-200 hover:border-red-400'}`}
                                                        >
                                                            {isImageBackground ? (
                                                                <div
                                                                    className="absolute inset-0 bg-cover bg-center"
                                                                    style={{ backgroundImage: `url(${theme.background})` }}
                                                                />
                                                            ) : hasBackground ? (
                                                                <div className="absolute inset-0" style={{ background: theme.background }} />
                                                            ) : (
                                                                <div className="absolute inset-0" style={{ backgroundColor: (theme as any).backgroundColor || theme.primaryColor }} />
                                                            )}

                                                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent">
                                                                <span className="text-white text-[10px] font-medium">{theme.name}</span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <label className="text-[13px] font-semibold text-black block">Görsel</label>
                                                {!canUseAdvancedDesigns && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                                        <Lock className="h-3 w-3" /> Full Branding
                                                    </span>
                                                )}
                                            </div>
                                            {!canUseAdvancedDesigns ? (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <div className="text-sm font-semibold text-amber-900">Gelismis tasarimlar full branding ozelligi</div>
                                                    <div className="text-xs text-amber-800 mt-1">Alt paketlerde sadece Varsayilan ve Cift Renkler aciktir. Ozel gorsel yukleme yapabilmek icin full branding paketi gerekir.</div>
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
                                                            onClick={() => setUpgradeContactOpen(true)}
                                                        >
                                                            Paket Yukselt
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Görsel URL'si veya yükle"
                                                        value={(() => {
                                                            const bg = ((eventData as any)?.settings?.theme || {})?.backgroundImage as string | undefined;
                                                            if (!bg) return '';
                                                            if (bg.startsWith('data:image/')) return 'Yüklü görsel (dosya)';
                                                            return bg;
                                                        })()}
                                                        readOnly
                                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-xs"
                                                    />
                                                    <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs font-medium">
                                                        Yükle
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleThemeBackgroundUpload}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[13px] font-semibold text-black block">🖼️ Logo</label>
                                                {!canUseBrandingLogos && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                                        <Lock className="h-3 w-3" /> Branding
                                                    </span>
                                                )}
                                            </div>

                                            {!canUseBrandingLogos ? (
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <div className="text-sm font-semibold text-amber-900">Logo ekleme full branding ozelligi</div>
                                                    <div className="text-xs text-amber-800 mt-1">Sadece full branding dahil paketlerde sunuma ozel logo ekleyebilir ve konum/boyut ayarlayabilirsiniz.</div>

                                                    {logo.url && (
                                                        <div className="mt-3 text-xs text-amber-900">
                                                            <div className="font-semibold">Mevcut logolar</div>
                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    className="px-3 py-2 rounded-md border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                                                                    onClick={() => {
                                                                        setLogo((prev) => ({ ...prev, url: null }));
                                                                        void updateThemeSettings({ logo: { ...logo, url: null }, logoUrl: null });
                                                                    }}
                                                                >
                                                                    Sol Logoyu Kaldır
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
                                                            onClick={() => setUpgradeContactOpen(true)}
                                                        >
                                                            Paket Yukselt
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Sol Üst Logo</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Logo URL'si veya yükle"
                                                                value={logo.url || ''}
                                                                onChange={(e) => setLogo({ ...logo, url: e.target.value || null })}
                                                                className="flex-1 p-2 border border-gray-200 rounded-lg text-xs"
                                                            />
                                                            <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs font-medium">
                                                                Yükle
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = (ev) => setLogo({ ...logo, url: ev.target?.result as string });
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                        {logo.url && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <img src={logo.url} alt="Logo" className="w-10 h-10 object-contain bg-gray-100 rounded" />
                                                                <button
                                                                    onClick={() => setLogo({ ...logo, url: null })}
                                                                    className="text-xs hover:underline"
                                                                    style={{ color: uiPrimaryHex }}
                                                                >
                                                                    Kaldır
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ ['--primary' as any]: uiPrimaryHslVar }}>
                                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Logo Boyutu: {logo.size}px</label>
                                                        <Slider
                                                            value={[logo.size]}
                                                            onValueChange={([v]) => setLogo({ ...logo, size: v })}
                                                            min={60}
                                                            max={800}
                                                            step={10}
                                                            className="w-full"
                                                        />

                                                        {logo.url && (
                                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-600 mb-1 block">X Konum: {logo.x}px</label>
                                                                    <Slider
                                                                        value={[logo.x]}
                                                                        onValueChange={([v]) => setLogo({ ...logo, x: v })}
                                                                        min={-400}
                                                                        max={400}
                                                                        step={10}
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Y Konum: {logo.y}px</label>
                                                                    <Slider
                                                                        value={[logo.y]}
                                                                        onValueChange={([v]) => setLogo({ ...logo, y: v })}
                                                                        min={-200}
                                                                        max={600}
                                                                        step={10}
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-[#3d4468] bg-[#232846] p-4 shadow-[0_12px_32px_rgba(4,10,28,0.28)]">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <label className="text-[13px] font-semibold text-white block">Mobil Katılım Ekranı</label>
                                                    <p className="text-xs text-[#b5bedf] mt-1">İlk açıldığında ana ekran temasını birebir kopyalar. Sonra mobilde istediğin alanı ayrı değiştirebilirsin.</p>
                                                </div>
                                                <Switch
                                                    checked={mobileThemeEnabled}
                                                    onCheckedChange={(next) => {
                                                        void (next ? enableCustomMobileTheme() : disableCustomMobileTheme());
                                                    }}
                                                />
                                            </div>

                                            {mobileThemeEnabled ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#41486e] bg-[#2b3153] px-3 py-2">
                                                        <div>
                                                            <div className="text-xs font-semibold text-white">Ana ekranla eşitle</div>
                                                            <div className="text-[11px] text-[#b5bedf]">Mobil görünümü mevcut ana ekran temasıyla yeniden aynı yapar.</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => { void syncMobileThemeWithMain(); }}
                                                            className="shrink-0 rounded-lg border border-[#57608d] bg-[#1d2240] px-3 py-2 text-xs font-semibold text-white hover:bg-[#252b4e]"
                                                        >
                                                            Ana Ekranı Kopyala
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#41486e] bg-[#2b3153] px-3 py-2">
                                                        <div>
                                                            <div className="text-xs font-semibold text-white">Mobil Animasyonu</div>
                                                            <div className="text-[11px] text-[#b5bedf]">Sadece mobil katılım ekranındaki arka plan animasyonunu aç veya kapat.</div>
                                                        </div>
                                                        <Switch
                                                            checked={Boolean(mobileThemePreview.bgAnimation)}
                                                            onCheckedChange={(next) => {
                                                                setMobileThemeSettings((prev) => ({ ...prev, enabled: true, bgAnimation: next }));
                                                                void updateMobileThemeSettings({ bgAnimation: next }, true);
                                                            }}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Tema Kategorisi</label>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {visibleThemeCategories.map((category) => (
                                                                <button
                                                                    key={category.id}
                                                                    type="button"
                                                                    onClick={() => setActiveMobileThemeCategory(category.id)}
                                                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeMobileThemeCategory === category.id
                                                                        ? 'bg-indigo-600 text-white'
                                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                                        }`}
                                                                >
                                                                    {category.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Mobil Tema</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(visibleThemeCategories.find((c) => c.id === activeMobileThemeCategory)?.themes || []).map((theme) => {
                                                                const hasBackground = 'background' in theme && theme.background;
                                                                const isImageBackground = hasBackground && isImageValue(theme.background);
                                                                const isSelected = mobileThemePreview.style === theme.id;

                                                                return (
                                                                    <button
                                                                        key={`mobile-${theme.id}`}
                                                                        type="button"
                                                                        onClick={() => applyMobileTheme(theme)}
                                                                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200 hover:border-indigo-400'}`}
                                                                    >
                                                                        {isImageBackground ? (
                                                                            <div
                                                                                className="absolute inset-0 bg-cover bg-center"
                                                                                style={{ backgroundImage: `url(${theme.background})` }}
                                                                            />
                                                                        ) : hasBackground ? (
                                                                            <div className="absolute inset-0" style={{ background: theme.background }} />
                                                                        ) : (
                                                                            <div className="absolute inset-0" style={{ backgroundColor: (theme as any).backgroundColor || theme.primaryColor }} />
                                                                        )}

                                                                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent">
                                                                            <span className="text-white text-[10px] font-medium">{theme.name}</span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Mobil Arka Plan</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={(() => {
                                                                    const bg = mobileThemePreview.backgroundImage || '';
                                                                    if (!bg) return '';
                                                                    if (bg.startsWith('data:image/')) return 'Yüklü görsel (dosya)';
                                                                    return bg;
                                                                })()}
                                                                placeholder="Mobil arka plan görseli"
                                                                className="flex-1 p-2 border border-gray-200 rounded-lg text-xs"
                                                            />
                                                            <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs font-medium">
                                                                Yükle
                                                                <input
                                                                    type="file"
                                                                    ref={mobileBackgroundInputRef}
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={handleMobileThemeBackgroundUpload}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-xs font-medium text-gray-600 block">Üst Logo Alanı</label>
                                                            {!canUseBrandingLogos && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                                                    <Lock className="h-3 w-3" /> Branding
                                                                </span>
                                                            )}
                                                        </div>

                                                        {!canUseBrandingLogos ? (
                                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                <div className="text-xs text-amber-800">Mobil üst alana özel logo eklemek için full branding gerekir.</div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Mobil üst logo URL'si"
                                                                        value={mobileThemePreview.heroLogoUrl || ''}
                                                                        onChange={(e) => {
                                                                            const nextValue = e.target.value || null;
                                                                            setMobileThemeSettings((prev) => ({ ...prev, enabled: true, heroLogoUrl: nextValue }));
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            void updateMobileThemeSettings({ heroLogoUrl: e.target.value || null }, true);
                                                                        }}
                                                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-xs"
                                                                    />
                                                                    <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs font-medium">
                                                                        Yükle
                                                                        <input
                                                                            type="file"
                                                                            ref={mobileLogoInputRef}
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            onChange={(e) => handleImageUpload(e, () => undefined, 'mobileLogo')}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                {mobileThemePreview.heroLogoUrl && (
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <img src={mobileThemePreview.heroLogoUrl} alt="Mobil hero logo" className="w-10 h-10 object-contain bg-gray-100 rounded" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMobileThemeSettings((prev) => ({ ...prev, heroLogoUrl: null }));
                                                                                void updateMobileThemeSettings({ heroLogoUrl: null }, true);
                                                                            }}
                                                                            className="text-xs hover:underline"
                                                                            style={{ color: uiPrimaryHex }}
                                                                        >
                                                                            Kaldır
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Üst Alan Rengi</label>
                                                            <input
                                                                type="color"
                                                                value={mobileThemePreview.heroPanelColor || '#6366f1'}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, heroPanelColor: nextValue }));
                                                                    void updateMobileThemeSettings({ heroPanelColor: nextValue }, true);
                                                                }}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white cursor-pointer"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Başlık Rengi</label>
                                                            <input
                                                                type="color"
                                                                value={mobileThemePreview.heroTitleColor || '#ffffff'}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, heroTitleColor: nextValue }));
                                                                    void updateMobileThemeSettings({ heroTitleColor: nextValue }, true);
                                                                }}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white cursor-pointer"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Açıklama Rengi</label>
                                                            <input
                                                                type="color"
                                                                value={mobileThemePreview.heroSubtitleColor || '#d1d5db'}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, heroSubtitleColor: nextValue }));
                                                                    void updateMobileThemeSettings({ heroSubtitleColor: nextValue }, true);
                                                                }}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white cursor-pointer"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Buton Başlangıç</label>
                                                            <input
                                                                type="color"
                                                                value={mobileThemeButtonStart}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, buttonColorStart: nextValue }));
                                                                    void updateMobileThemeSettings({ buttonColorStart: nextValue }, true);
                                                                }}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Buton Bitiş</label>
                                                            <input
                                                                type="color"
                                                                value={mobileThemeButtonEnd}
                                                                onChange={(e) => {
                                                                    const nextValue = e.target.value;
                                                                    setMobileThemeSettings((prev) => ({ ...prev, enabled: true, buttonColorEnd: nextValue }));
                                                                    void updateMobileThemeSettings({ buttonColorEnd: nextValue }, true);
                                                                }}
                                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-500">
                                                    Bu alanı açarsan mobil katılım ekranını ana ekrandan bağımsız özelleştirebilirsin.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </TabsContent>

                    </Tabs>
                </div>

            </div>
            </div>
            {showEventModal && (
                <CreateEventModal
                    onClose={() => setShowEventModal(false)}
                    onEventCreated={(event) => {
                        console.log('Event created:', event);
                        // Optional: Redirect or update local state
                    }}
                />
            )}

            <UpgradeContactModal open={upgradeContactOpen} onClose={() => setUpgradeContactOpen(false)} />
        </div>
        </>
    );
}
