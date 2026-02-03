"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Type,
    Palette,
    Target,
    Play,
    Share2,
    Lock,
    ChevronLeft,
    Plus,
    Trash2,
    Image as ImageIcon,
    X,
    ChevronDown,
    MonitorPlay,
    StopCircle,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import CreateEventModal from '@/components/Event/CreateEventModal';
import { getEvent, updateEvent, Event } from '@/services/api';
import QRCodeDisplay from '@/components/Event/QRCodeDisplay';

// --- Constants & Types ---

const LIVE_PREVIEW_W = 1920;
const LIVE_PREVIEW_H = 1080;

function ScaledIframe({ src, title }: { src: string; title: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const compute = () => {
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const s = Math.min(rect.width / LIVE_PREVIEW_W, rect.height / LIVE_PREVIEW_H);
            setScale(Number.isFinite(s) && s > 0 ? s : 1);
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

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            <div
                className="absolute top-0 left-0"
                style={{
                    width: LIVE_PREVIEW_W,
                    height: LIVE_PREVIEW_H,
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                }}
            >
                <iframe
                    title={title}
                    src={src}
                    width={LIVE_PREVIEW_W}
                    height={LIVE_PREVIEW_H}
                    className="block"
                    style={{ border: 0 }}
                    scrolling="no"
                />
            </div>
        </div>
    );
}

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

const CF_IMG = 'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ';

const THEME_CATEGORIES = [
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
            { id: 'confetti2', name: 'Konfeti 2', background: `${CF_IMG}/7128a33a-4666-43e1-4389-4bb4c08a2c00/soruyorum`, primaryColor: '#ec4899' },
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
            { id: 'balloon10', name: 'Balon 10', background: `${CF_IMG}/31b1142a-c1b1-4666-344b-dd20b78c1500/soruyorum`, primaryColor: '#14b8a6' },
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
}

interface Slide {
    id: number;
    type: 'q-and-a';
    question: string;
    background: string;
    image: string | null;
    style: SlideStyle;
}

export default function EventEditorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    // --- State ---
    const [slides, setSlides] = useState<Slide[]>([
        {
            id: 1,
            type: 'q-and-a',
            question: "Merak Ettikleriniz?",
            background: THEMES.business,
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
    const [activeTab, setActiveTab] = useState('edit');
    const [presentationTitle, setPresentationTitle] = useState("Başlıksız Sunum");

    // Settings State
    const [showInstructions, setShowInstructions] = useState(true);
    const [showQR, setShowQR] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [showNames, setShowNames] = useState(false);
    const [bgAnimation, setBgAnimation] = useState(false);
    const [bgAnimationType, setBgAnimationType] = useState('gradient');

    // Live screen (ekran.*) layout
    const [screenMode, setScreenMode] = useState<'wall' | 'rotate'>('wall');

    // Logos
    const [logo, setLogo] = useState<LogoSettings>({ url: null, x: 0, y: 0, size: 240 });
    const [rightLogo, setRightLogo] = useState<LogoSettings>({ url: null, x: 0, y: 0, size: 240, anchor: 'top-right' });

    // QR Position
    const [qrPos, setQrPos] = useState({ x: 40, y: 40 });

    // Toggles
    const [isLocked, setIsLocked] = useState(false);
    const [requireCode, setRequireCode] = useState(true);
    const [allowMultiple, setAllowMultiple] = useState(true);
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [liveResults, setLiveResults] = useState(true);

    // UI State
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const [textColorDropdownOpen, setTextColorDropdownOpen] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventData, setEventData] = useState<Event | null>(null);
    const [isPresentationStarted, setIsPresentationStarted] = useState(false);
    const [activeThemeCategory, setActiveThemeCategory] = useState('festival');
    const [themeSlideIndex, setThemeSlideIndex] = useState(0);
    const [themeSlideshow, setThemeSlideshow] = useState(false);
    const [livePreviewView, setLivePreviewView] = useState<'join' | 'wall' | 'rotate'>('join');
    const [livePreviewAuto, setLivePreviewAuto] = useState(false);
    const [centerLivePreview, setCenterLivePreview] = useState(true);
    
    // Hostname state - initialized empty for SSR compatibility
    const [hostName, setHostName] = useState('');

    const activeThemeList = useMemo(() => {
        return (THEME_CATEGORIES.find((c) => c.id === activeThemeCategory)?.themes || []) as Array<any>;
    }, [activeThemeCategory]);

    const activeThemeSlide = activeThemeList[themeSlideIndex] as any;

    useEffect(() => {
        setThemeSlideIndex(0);
    }, [activeThemeCategory]);

    useEffect(() => {
        if (!themeSlideshow) return;
        if (!activeThemeList.length) return;

        const t = setInterval(() => {
            setThemeSlideIndex((prev) => (prev + 1) % activeThemeList.length);
        }, 2500);

        return () => clearInterval(t);
    }, [themeSlideshow, activeThemeList.length]);

    useEffect(() => {
        if (!livePreviewAuto) return;
        const order: Array<'join' | 'wall' | 'rotate'> = ['join', 'wall', 'rotate'];
        const t = setInterval(() => {
            setLivePreviewView((prev) => {
                const idx = order.indexOf(prev);
                return order[(idx + 1) % order.length] || 'join';
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

    const updateThemeSettings = async (patch: Record<string, any>) => {
        if (!eventData) return;

        const prevSettings = (eventData as any)?.settings || {};
        const prevTheme = prevSettings?.theme || {};
        const nextTheme = {
            ...prevTheme,
            ...patch,
        };
        const nextSettings = {
            ...prevSettings,
            theme: nextTheme,
        };

        try {
            const updated = await updateEvent(eventData.id, { settings: nextSettings } as any);
            setEventData((prev) => ({ ...(prev as any), ...(updated as any), settings: (updated as any)?.settings ?? nextSettings }));
        } catch (err) {
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

    const applyTheme = async (theme: any) => {
        if (!theme) return;
        const hasBackground = 'background' in theme && theme.background;
        const isImageBackground = hasBackground && (theme.background.startsWith('/') || theme.background.startsWith('http'));

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
            background: isImageBackground ? theme.background : undefined,
            backgroundImage: isImageBackground ? theme.background : undefined,
            backgroundColor: !isImageBackground ? ((theme as any).backgroundColor || theme.primaryColor) : undefined,
        });
    };

    // Set hostname on client side to avoid hydration mismatch.
    // IMPORTANT: Do not blindly trust eventData.joinUrl; older events may contain the other tenant's domain.
    useEffect(() => {
        const currentHost = (window.location.hostname || '').toLowerCase();
        const variant = (process.env.NEXT_PUBLIC_SITE_VARIANT || '').toLowerCase();

        const inferredJoinHost = (() => {
            if (currentHost.includes('soruyorum.online')) return 'mobil.soruyorum.online';
            if (currentHost.includes('ksinteraktif.com')) return 'mobil.ksinteraktif.com';
            if (variant === 'soruyorum') return 'mobil.soruyorum.online';
            if (variant === 'ksinteraktif') return 'mobil.ksinteraktif.com';
            return 'mobil.soruyorum.online';
        })();

        // If the event has a joinUrl matching the current brand, we can display that hostname.
        // Otherwise, always show the inferred canonical host for this deployment.
        if (eventData?.joinUrl) {
            try {
                const url = new URL(eventData.joinUrl);
                const urlHost = (url.hostname || '').toLowerCase();

                if (inferredJoinHost.endsWith('soruyorum.online') && urlHost.endsWith('soruyorum.online')) {
                    setHostName(url.hostname);
                    return;
                }
                if (inferredJoinHost.endsWith('ksinteraktif.com') && urlHost.endsWith('ksinteraktif.com')) {
                    setHostName(url.hostname);
                    return;
                }
            } catch {
                // ignore
            }
        }

        setHostName(inferredJoinHost);
    }, [eventData?.joinUrl]);

    const canonicalJoinUrl = useMemo(() => {
        const joinHost = hostName || '';
        const pin = (eventData as any)?.eventPin || (eventData as any)?.event_pin || (eventData as any)?.pin || '';
        if (!joinHost) return '';
        if (!pin) return `https://${joinHost}`;
        return `https://${joinHost}/join?pin=${encodeURIComponent(pin)}`;
    }, [hostName, eventData]);

    const resolvedEventPin = useMemo(() => {
        return (eventData as any)?.eventPin || (eventData as any)?.event_pin || (eventData as any)?.pin || '';
    }, [eventData]);

    const qrCodeUrl = useMemo(() => {
        if (!canonicalJoinUrl) return '';
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(canonicalJoinUrl)}`;
    }, [canonicalJoinUrl]);

    // Fetch Event Data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await getEvent(params.id);
                setEventData(data);
                const initialMode = ((data as any)?.settings?.qanda?.screenMode as string | undefined) || 'wall';
                setScreenMode(initialMode === 'rotate' ? 'rotate' : 'wall');
                
                // Tema ayarlarını slide'lara uygula
                const themeSettings = (data as any)?.settings?.theme;
                if (themeSettings) {
                    let themeBackground = THEMES.business; // varsayılan
                    
                    // Eğer backgroundImage varsa (görsel tema)
                    if (themeSettings.backgroundImage && themeSettings.backgroundImage.startsWith('/')) {
                        themeBackground = `url(${themeSettings.backgroundImage})`;
                    } else if (themeSettings.backgroundColor && themeSettings.backgroundColor.startsWith('/')) {
                        themeBackground = `url(${themeSettings.backgroundColor})`;
                    } else if (themeSettings.backgroundColor) {
                        // Düz renk veya gradient
                        themeBackground = themeSettings.backgroundColor;
                    } else if (themeSettings.style && THEMES[themeSettings.style as keyof typeof THEMES]) {
                        themeBackground = THEMES[themeSettings.style as keyof typeof THEMES];
                    }
                    
                    // Tüm slide'ların arka planını güncelle
                    setSlides(prevSlides => prevSlides.map(slide => ({
                        ...slide,
                        background: themeBackground,
                    })));

                    // --- Sync editor state from saved theme settings ---
                    if (typeof themeSettings.showInstructions === 'boolean') setShowInstructions(themeSettings.showInstructions);
                    if (typeof themeSettings.showQR === 'boolean') setShowQR(themeSettings.showQR);
                    if (typeof themeSettings.showStats === 'boolean') setShowStats(themeSettings.showStats);
                    if (typeof themeSettings.showNames === 'boolean') setShowNames(themeSettings.showNames);
                    if (typeof themeSettings.bgAnimation === 'boolean') setBgAnimation(themeSettings.bgAnimation);

                    if (themeSettings.qrPos && typeof themeSettings.qrPos.x === 'number' && typeof themeSettings.qrPos.y === 'number') {
                        setQrPos({ x: themeSettings.qrPos.x, y: themeSettings.qrPos.y });
                    }

                    if (themeSettings.logo && typeof themeSettings.logo === 'object') {
                        setLogo((prev) => ({
                            ...prev,
                            ...(themeSettings.logo || {}),
                        }));
                    } else if (typeof themeSettings.logoUrl === 'string' && themeSettings.logoUrl) {
                        setLogo((prev) => ({ ...prev, url: themeSettings.logoUrl }));
                    }

                    if (themeSettings.rightLogo && typeof themeSettings.rightLogo === 'object') {
                        setRightLogo((prev) => ({
                            ...prev,
                            ...(themeSettings.rightLogo || {}),
                        }));
                    }

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
                }
            } catch (err) {
                console.error("Failed to fetch event:", err);
            }
        };
        fetchEvent();
    }, [params.id]);

    const persistScreenMode = async (mode: 'wall' | 'rotate') => {
        if (!eventData) return;

        setScreenMode(mode);

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

    const currentSlide = slides[currentSlideIndex];
    const selectedThemeTextColor = ((eventData as any)?.settings?.theme?.textColor as string | undefined) || currentSlide?.style?.color;

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

    const addSlide = () => {
        const newId = Math.max(...slides.map(s => s.id)) + 1;
        setSlides([...slides, {
            ...slides[0],
            id: newId,
            question: "Yeni Soru",
            image: null
        }]);
        setCurrentSlideIndex(slides.length);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: any) => void, field?: string) => {
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
            void updateThemeSettings({ logo, rightLogo, qrPos });
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

            const hostname = window.location.hostname;
            let screenHost = 'https://ekran.ksinteraktif.com';
            if (hostname.includes('soruyorum.online')) {
                screenHost = 'https://ekran.soruyorum.online';
            } else if (hostname.includes('ksinteraktif.com')) {
                screenHost = 'https://ekran.ksinteraktif.com';
            }

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
        <div className="h-screen flex flex-col bg-[#f5f7fa] overflow-hidden font-['Inter'] text-[#2c3e50]">
            {/* 
        -----------------------------------------------------------------------
        HEADER - Colorful Toolbar
        -----------------------------------------------------------------------
      */}
            <header className="h-[50px] bg-[#2d3748] flex items-center justify-between px-4 shrink-0 z-50">
                {/* Left Group - Settings */}
                <div className="flex items-center gap-1">
                    <button 
                        className={`flex items-center gap-1.5 px-3 py-2 rounded text-white text-xs font-semibold transition-all ${anonymousMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                        onClick={() => setAnonymousMode(!anonymousMode)}
                    >
                        <span>🕶️</span> {anonymousMode ? 'Anonim Açık' : 'Anonim Kapalı'}
                    </button>
                    {isPresentationStarted ? (
                        <button
                            onClick={handleStopPresentation}
                            className="flex items-center gap-1.5 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all"
                        >
                            <span>⏹️</span> Sunumu Durdur
                        </button>
                    ) : (
                        <button
                            onClick={handleStartPresentation}
                            className="flex items-center gap-1.5 px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-all"
                        >
                            <span>▶️</span> Sunumu Başlat
                        </button>
                    )}
                </div>

                {/* Right Group - Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => router.push(`/events/${params.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all"
                    >
                        <span>🎛️</span> Moderatör Paneli
                    </button>
                    <button 
                        className="flex items-center gap-1.5 px-3 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                    >
                        <span>←</span> Önceki
                    </button>
                    <button 
                        className="flex items-center gap-1.5 px-3 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
                        onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                    >
                        Sonraki <span>→</span>
                    </button>
                    {isPresentationStarted && (
                        <button
                            onClick={handleStopPresentation}
                            className="flex items-center gap-1.5 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all"
                        >
                            <span>⏹️</span> Sunumu Durdur
                        </button>
                    )}
                </div>
            </header>

            {/* 
        -----------------------------------------------------------------------
        MAIN CONTAINER
        -----------------------------------------------------------------------
      */}
            <div className="grid grid-cols-[240px_1fr_340px] flex-1 overflow-hidden">

                {/* LEFT SIDEBAR - SLIDES */}
                <div className="bg-white border-r border-[#e8ecf1] p-4 overflow-y-auto">
                    <button className="w-full p-3 bg-red-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer mb-4 flex items-center justify-center gap-2 hover:bg-red-700 transition-all" onClick={addSlide}>
                        <Plus className="h-4 w-4" /> Yeni Slayt
                    </button>

                    <div className="flex flex-col gap-3">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all ${index === currentSlideIndex
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-transparent hover:border-[#c1c7d0] bg-[#f5f7fa]'
                                    }`}
                                onClick={() => setCurrentSlideIndex(index)}
                            >
                                <div className="absolute top-2 left-2 w-6 h-6 rounded bg-white text-[#5e6c84] flex items-center justify-center text-xs font-semibold shadow-sm z-10">
                                    {index + 1}
                                </div>

                                {slides.length > 1 && (
                                    <button
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10 hover:scale-110"
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}

                                <div 
                                    className="w-full aspect-video rounded flex items-center justify-center text-xs text-white overflow-hidden relative bg-cover bg-center"
                                    style={{ 
                                        background: slide.background.startsWith('url(') 
                                            ? undefined 
                                            : slide.background,
                                        backgroundImage: slide.background.startsWith('url(') 
                                            ? slide.background 
                                            : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="flex flex-col items-center justify-center h-full w-full p-3 relative z-10">
                                        <div className="font-semibold text-sm mb-2 text-center truncate w-full text-white drop-shadow-lg">{slide.question}</div>
                                        <div className="text-[10px] opacity-80 text-white">Gönderin</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-[11px] text-[#7f8c97] text-center">Soru Gönder</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER - EDITOR AREA */}
                <div className="bg-[#f5f7fa] p-8 flex flex-col items-center justify-center gap-4 overflow-auto">
                    <div className="w-full max-w-[960px] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-700">🖥️ Canlı Önizleme</span>
                            <Switch checked={centerLivePreview} onCheckedChange={setCenterLivePreview} />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setLivePreviewView('join')}
                                className={
                                    "px-3 py-2 rounded-lg text-xs font-bold border transition-all " +
                                    (livePreviewView === 'join'
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-[#2c3e50] border-[#dfe1e6] hover:border-purple-500')
                                }
                            >
                                Join
                            </button>
                            <button
                                type="button"
                                onClick={() => setLivePreviewView('wall')}
                                className={
                                    "px-3 py-2 rounded-lg text-xs font-bold border transition-all " +
                                    (livePreviewView === 'wall'
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-[#2c3e50] border-[#dfe1e6] hover:border-purple-500')
                                }
                            >
                                Duvar
                            </button>
                            <button
                                type="button"
                                onClick={() => setLivePreviewView('rotate')}
                                className={
                                    "px-3 py-2 rounded-lg text-xs font-bold border transition-all " +
                                    (livePreviewView === 'rotate'
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-[#2c3e50] border-[#dfe1e6] hover:border-purple-500')
                                }
                            >
                                Tek tek
                            </button>
                            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                <span className="text-[11px] text-gray-500">Slayt</span>
                                <Switch checked={livePreviewAuto} onCheckedChange={setLivePreviewAuto} />
                            </div>
                        </div>
                    </div>

                    {centerLivePreview ? (
                        <div className="w-full max-w-[960px] aspect-video rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden border border-gray-200 bg-black">
                            <ScaledIframe
                                title="Canlı ekran önizleme (merkez)"
                                src={`/events/${params.id}/live?view=${livePreviewView}&embed=1`}
                            />
                        </div>
                    ) : (
                        <div
                            className="w-full max-w-[960px] aspect-video rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center justify-center p-[60px] text-center transition-all duration-400 bg-cover bg-center"
                            style={{ 
                                background: currentSlide.background.startsWith('url(') 
                                    ? undefined 
                                    : currentSlide.background,
                                backgroundImage: currentSlide.background.startsWith('url(') 
                                    ? currentSlide.background 
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
                </div>

                {/* RIGHT SIDEBAR - SETTINGS */}
                <div className="bg-white border-l border-[#e8ecf1] flex flex-col overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6">
                        <TabsList className="flex gap-2 mb-6 border-b border-[#e8ecf1] pb-2 bg-transparent w-full justify-start h-auto">
                            <TabsTrigger value="edit" className="flex-1 flex flex-col gap-1 py-2 text-[13px] font-semibold text-[#5e6c84] data-[state=active]:text-red-600 data-[state=active]:bg-red-50 rounded-md transition-all h-auto">
                                <Type className="h-[18px] w-[18px]" />
                                <span>Edit</span>
                            </TabsTrigger>
                            <TabsTrigger value="theme" className="flex-1 flex flex-col gap-1 py-2 text-[13px] font-semibold text-[#5e6c84] data-[state=active]:text-red-600 data-[state=active]:bg-red-50 rounded-md transition-all h-auto">
                                <Palette className="h-[18px] w-[18px]" />
                                <span>Tema</span>
                            </TabsTrigger>
                            <TabsTrigger value="interactivity" className="flex-1 flex flex-col gap-1 py-2 text-[13px] font-semibold text-[#5e6c84] data-[state=active]:text-red-600 data-[state=active]:bg-red-50 rounded-md transition-all h-auto">
                                <Target className="h-[18px] w-[18px]" />
                                <span>Interactivity</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="m-0 space-y-6 animate-in slide-in-from-right-4 duration-300">

                            {/* Presentation Title */}
                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-2 block">Sunum Başlığı</label>
                                <input
                                    className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg text-base focus:border-[#667eea] outline-none transition-all"
                                    value={currentSlide.question} // Assuming question changes title too as per legacy logic
                                    onChange={(e) => updateSlide('question', e.target.value)}
                                    placeholder="Sunum başlığını yazın..."
                                />
                            </div>

                            {/* Font Settings */}
                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-2 block">Yazı Stili</label>

                                <div className="mb-3">
                                    <label className="text-xs font-medium text-[#7f8c97] mb-1.5 block">Font</label>
                                    <select
                                        className="w-full p-2.5 border border-[#dfe1e6] rounded-md text-sm bg-white focus:border-red-500 outline-none transition-all"
                                        value={currentSlide.style.fontFamily}
                                        onChange={(e) => {
                                            const fontFamily = e.target.value;
                                            updateSlide('style.fontFamily', fontFamily);
                                            void updateThemeSettings({ fontFamily });
                                        }}
                                    >
                                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                    </select>
                                </div>

                                <div className="mb-3 relative">
                                    <label className="text-xs font-medium text-[#7f8c97] mb-1.5 block">Yazı Rengi</label>
                                    <button
                                        className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg bg-white flex items-center justify-between hover:border-red-500 transition-all"
                                        onClick={() => setTextColorDropdownOpen(!textColorDropdownOpen)}
                                    >
                                        <div className="w-10 h-10 rounded border-2 border-[#e0e0e0]" style={{ background: currentSlide.style.color }} />
                                        <span className="flex-1 ml-3 text-left font-medium text-sm">Yazı rengi seçin</span>
                                        <ChevronDown className={`h-3 w-3 transition-transform ${textColorDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {textColorDropdownOpen && (
                                        <div className="grid grid-cols-5 gap-2 p-3 bg-white border rounded-lg shadow-lg absolute top-[calc(100%+8px)] left-0 right-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {TEXT_COLORS.map(color => (
                                                <div
                                                    key={color}
                                                    className={`aspect-square rounded-md border-2 cursor-pointer hover:scale-110 transition-transform ${selectedThemeTextColor === color ? 'border-red-500 ring-2 ring-red-500/20' : 'border-transparent'}`}
                                                    style={{ background: color }}
                                                    onClick={() => {
                                                        void handleTextColorPick(color);
                                                        setTextColorDropdownOpen(false);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mb-3">
                                    {['bold', 'italic', 'underline', 'shadow'].map((style) => (
                                        <button
                                            key={style}
                                            className={`flex-1 py-2.5 border-2 rounded-md text-base transition-all flex items-center justify-center ${
                                                // @ts-ignore
                                                currentSlide.style[style]
                                                    ? 'bg-red-600 text-white border-red-600'
                                                    : 'bg-white border-[#e8ecf1] hover:bg-[#f8f9fa] hover:border-red-500'
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

                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-red-600 mb-1">
                                        <span className="text-[#7f8c97]">Yazı Boyutu</span>
                                        <span>{currentSlide.style.fontSize}px</span>
                                    </div>
                                    <Slider
                                        min={24} max={72} step={1}
                                        value={[currentSlide.style.fontSize]}
                                        onValueChange={(val) => updateSlide('style.fontSize', val[0])}
                                        className="my-2"
                                    />
                                </div>
                            </div>

                            {/* Position Sliders */}
                            <div className="mb-6 grid grid-cols-2 gap-3 items-end">
                                <div>
                                    <label className="text-xs font-medium text-[#7f8c97] mb-1.5 block">Başlık X</label>
                                    <Slider min={-600} max={600} step={5} value={[currentSlide.style.headingX]} onValueChange={(val) => updateSlide('style.headingX', val[0])} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#7f8c97] mb-1.5 block">Başlık Y</label>
                                    <Slider min={-200} max={400} step={5} value={[currentSlide.style.headingY]} onValueChange={(val) => updateSlide('style.headingY', val[0])} />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-2 block">Görsel</label>
                                <div
                                    className="w-full h-40 border-2 border-dashed border-[#dfe1e6] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all bg-[#f9fafc] group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-[#667eea] mb-2" />
                                    <div className="text-[13px] font-medium text-[#7f8c97]">Sürükle & Bırak</div>
                                    <div className="text-[11px] text-[#a5adba] mt-1">veya göz atmak için tıklayın</div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => updateSlide('image', val), 'image')} />
                            </div>

                            {/* Background Color */}
                            <div className="mb-6 relative">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-2 block">Arka Plan Rengi</label>
                                <button
                                    className="w-full p-3 border-2 border-[#e0e0e0] rounded-lg bg-white flex items-center justify-between hover:border-red-500 transition-all"
                                    onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                                >
                                    <div className="w-10 h-10 rounded border-2 border-[#e0e0e0]" style={{ background: currentSlide.background }} />
                                    <span className="flex-1 ml-3 text-left font-medium text-sm">Renk seçin</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {colorDropdownOpen && (
                                    <div className="grid grid-cols-4 gap-2 p-3 bg-white border rounded-lg shadow-lg absolute top-[calc(100%+8px)] left-0 right-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        {Object.values(THEMES).map((bg, i) => (
                                            <div
                                                key={i}
                                                className={`aspect-square rounded-md border-2 cursor-pointer hover:scale-110 transition-transform ${currentSlide.background === bg ? 'border-red-500 ring-2 ring-red-500/20' : 'border-transparent'}`}
                                                style={{ background: bg }}
                                                onClick={() => {
                                                    updateSlide('background', bg);
                                                    setColorDropdownOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Instructions Toggles */}
                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-3 block">Katılım Talimatları</label>
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
                                                    item.set(next);
                                                    void updateThemeSettings({ [item.key]: next } as any);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logos */}
                            <div className="mb-6 pt-6 border-t border-[#e2e8f0]">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-3 block">Sunum Logosu</label>
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
                                                <span className="text-[#7f8c97]">Boyut</span>
                                                <span style={{ color: uiPrimaryHex }}>{logo.size}px</span>
                                            </div>
                                            <Slider min={60} max={800} value={[logo.size]} onValueChange={(val) => setLogo(prev => ({ ...prev, size: val[0] }))} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-xs text-[#7f8c97] block mb-1">X Konum</span>
                                                <Slider min={-400} max={400} value={[logo.x]} onValueChange={(val) => setLogo(prev => ({ ...prev, x: val[0] }))} />
                                            </div>
                                            <div>
                                                <span className="text-xs text-[#7f8c97] block mb-1">Y Konum</span>
                                                <Slider min={-200} max={600} value={[logo.y]} onValueChange={(val) => setLogo(prev => ({ ...prev, y: val[0] }))} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-dashed border-[#e2e8f0]">
                                    <label className="text-[13px] font-semibold text-[#5e6c84] mb-3 block">Sağ Logo</label>
                                    <div className="flex gap-2 mb-3">
                                        <button className="flex-1 bg-white border border-[#dfe1e6] rounded-md py-2 text-sm font-medium hover:bg-[#f5f7fa]" onClick={() => rightLogoInputRef.current?.click()}>
                                            📷 Sağ Logo Yükle
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
                                        <div
                                            className="space-y-3 pl-2 border-l-2 border-[#e2e8f0]"
                                            style={{ ['--primary' as any]: uiPrimaryHslVar }}
                                        >
                                            <div>
                                                <div className="flex justify-between text-xs font-semibold mb-1">
                                                    <span className="text-[#7f8c97]">Boyut</span>
                                                    <span style={{ color: uiPrimaryHex }}>{rightLogo.size}px</span>
                                                </div>
                                                <Slider min={60} max={800} value={[rightLogo.size]} onValueChange={(val) => setRightLogo(prev => ({ ...prev, size: val[0] }))} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-xs text-[#7f8c97] block mb-1">X Konum</span>
                                                    <Slider min={-400} max={400} value={[rightLogo.x]} onValueChange={(val) => setRightLogo(prev => ({ ...prev, x: val[0] }))} />
                                                </div>
                                                <div>
                                                    <span className="text-xs text-[#7f8c97] block mb-1">Y Konum</span>
                                                    <Slider min={-200} max={600} value={[rightLogo.y]} onValueChange={(val) => setRightLogo(prev => ({ ...prev, y: val[0] }))} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* QR Position */}
                            <div className="mb-6 pt-6 border-t border-[#e2e8f0]">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-3 block">QR Kod Konumu</label>
                                <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-[#e2e8f0]">
                                    <div>
                                        <div className="flex justify-between text-xs text-[#667eea] font-semibold mb-1"><span className="text-[#7f8c97]">QR X (Sol)</span></div>
                                        <Slider min={0} max={1820} value={[qrPos.x]} onValueChange={(val) => setQrPos(prev => ({ ...prev, x: val[0] }))} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-[#667eea] font-semibold mb-1"><span className="text-[#7f8c97]">QR Y (Alt)</span></div>
                                        <Slider min={0} max={1040} value={[qrPos.y]} onValueChange={(val) => setQrPos(prev => ({ ...prev, y: val[0] }))} />
                                    </div>
                                </div>
                            </div>

                        </TabsContent>

                        <TabsContent value="interactivity" className="m-0 space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <label className="text-[13px] font-semibold text-[#5e6c84] mb-3 block">Etkileşim Ayarları</label>
                                <div className="space-y-3">
                                    <div className="pt-2 pb-4 border-b border-[#eef2f7]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-semibold text-[#2c3e50]">Ekran görünümü</div>
                                                <div className="text-xs text-[#7f8c97]">ekran.soruyorum.online / ekran.ksinteraktif.com</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => persistScreenMode('wall')}
                                                    className={
                                                        "px-3 py-2 rounded-lg text-xs font-bold border transition-all " +
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
                                                        "px-3 py-2 rounded-lg text-xs font-bold border transition-all " +
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
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#2c3e50]">Canlı sonuçlar</span>
                                        <Switch checked={liveResults} onCheckedChange={setLiveResults} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#2c3e50]">Anonim yanıtlar</span>
                                        <Switch checked={anonymousMode} onCheckedChange={setAnonymousMode} />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="theme" className="m-0 animate-in slide-in-from-right-4 duration-300">
                            <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                
                                {/* Kategori Sekmeleri */}
                                <div>
                                    <label className="text-[13px] font-semibold text-[#5e6c84] block mb-2">Tema Kategorisi</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {THEME_CATEGORIES.map((category) => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => setActiveThemeCategory(category.id)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                                                    activeThemeCategory === category.id
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tema Slayt Önizleme */}
                                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                                    <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold text-gray-700">🎞️ Tema Önizleme</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-gray-500">Oto</span>
                                            <Switch checked={themeSlideshow} onCheckedChange={setThemeSlideshow} />
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                                            {activeThemeSlide ? (
                                                (() => {
                                                    const hasBackground = 'background' in activeThemeSlide && activeThemeSlide.background;
                                                    const isImageBackground = hasBackground && (activeThemeSlide.background.startsWith('/') || activeThemeSlide.background.startsWith('http'));

                                                    if (isImageBackground) {
                                                        return (
                                                            <div
                                                                className="absolute inset-0 bg-cover bg-center"
                                                                style={{ backgroundImage: `url(${activeThemeSlide.background})` }}
                                                            />
                                                        );
                                                    }
                                                    if (hasBackground) {
                                                        return <div className="absolute inset-0" style={{ background: activeThemeSlide.background }} />;
                                                    }
                                                    return (
                                                        <div
                                                            className="absolute inset-0"
                                                            style={{ backgroundColor: (activeThemeSlide as any).backgroundColor || activeThemeSlide.primaryColor }}
                                                        />
                                                    );
                                                })()
                                            ) : (
                                                <div className="absolute inset-0 bg-gray-100" />
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                            <button
                                                type="button"
                                                onClick={() => applyTheme(activeThemeSlide)}
                                                className="absolute inset-0 text-left"
                                                title="Bu temayı uygula"
                                            />

                                            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                                                <div>
                                                    <div className="text-white text-xs font-semibold">{activeThemeSlide?.name || 'Tema'}</div>
                                                    <div className="text-white/70 text-[11px]">Tıkla: uygula</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setThemeSlideIndex((prev) =>
                                                                activeThemeList.length ? (prev - 1 + activeThemeList.length) % activeThemeList.length : 0
                                                            )
                                                        }
                                                        className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm flex items-center justify-center"
                                                        title="Önceki"
                                                    >
                                                        <ArrowLeft className="w-4 h-4 text-white" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setThemeSlideIndex((prev) =>
                                                                activeThemeList.length ? (prev + 1) % activeThemeList.length : 0
                                                            )
                                                        }
                                                        className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm flex items-center justify-center"
                                                        title="Sonraki"
                                                    >
                                                        <ArrowRight className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tema Grid */}
                                <div>
                                    <label className="text-[13px] font-semibold text-[#5e6c84] block mb-2">
                                        {THEME_CATEGORIES.find(c => c.id === activeThemeCategory)?.name || 'Temalar'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(THEME_CATEGORIES.find(c => c.id === activeThemeCategory)?.themes || []).map((theme) => {
                                            const hasBackground = 'background' in theme && theme.background;
                                            const isImageBackground = hasBackground && (theme.background.startsWith('/') || theme.background.startsWith('http'));
                                            const isSelected = currentSlide.style && (eventData as any)?.settings?.theme?.style === theme.id;
                                            
                                            return (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => applyTheme(theme)}
                                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                                        isSelected ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-200 hover:border-red-400'
                                                    }`}
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

                                {/* Özelleştirme Bölümü */}
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="text-[13px] font-semibold text-[#5e6c84] block mb-3">⚙️ Özelleştirme</label>
                                    
                                    {/* Yazı Tipi */}
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Yazı Tipi</label>
                                        <select
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-red-500 outline-none"
                                            value={currentSlide.style.fontFamily}
                                                onChange={(e) => {
                                                    const fontFamily = e.target.value;
                                                    updateSlide('style.fontFamily', fontFamily);
                                                    void updateThemeSettings({ fontFamily });
                                                }}
                                        >
                                            {FONTS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Yazı Rengi */}
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Yazı Rengi</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {TEXT_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => void handleTextColorPick(color)}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                                                        selectedThemeTextColor === color ? 'border-red-500 scale-110' : 'border-gray-300'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Yazı Boyutu */}
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Yazı Boyutu: {currentSlide.style.fontSize}px</label>
                                        <Slider
                                            value={[currentSlide.style.fontSize]}
                                            onValueChange={([v]) => updateSlide('style.fontSize', v)}
                                            min={24}
                                            max={72}
                                            step={2}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Yazı Stilleri */}
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Yazı Stili</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateSlide('style.bold', !currentSlide.style.bold)}
                                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${
                                                    currentSlide.style.bold ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:border-red-400'
                                                }`}
                                            >
                                                B
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSlide('style.italic', !currentSlide.style.italic)}
                                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center italic transition-all ${
                                                    currentSlide.style.italic ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:border-red-400'
                                                }`}
                                            >
                                                I
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSlide('style.underline', !currentSlide.style.underline)}
                                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center underline transition-all ${
                                                    currentSlide.style.underline ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:border-red-400'
                                                }`}
                                            >
                                                U
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSlide('style.shadow', !currentSlide.style.shadow)}
                                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                    currentSlide.style.shadow ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:border-red-400'
                                                }`}
                                                title="Gölge"
                                            >
                                                S
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Logo Bölümü */}
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="text-[13px] font-semibold text-[#5e6c84] block mb-3">🖼️ Logo</label>
                                    
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
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => setLogo({ ...logo, url: ev.target?.result as string });
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
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
                                </div>

                                {/* Sunum Ayarları */}
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="text-[13px] font-semibold text-[#5e6c84] block mb-3">📺 Sunum Ayarları</label>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">Talimat çubuğu göster</span>
                                            <Switch checked={showInstructions} onCheckedChange={setShowInstructions} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">QR kodu göster</span>
                                            <Switch checked={showQR} onCheckedChange={setShowQR} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">Katılımcı bilgisi göster</span>
                                            <Switch checked={showStats} onCheckedChange={setShowStats} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">Katılımcı isimlerini göster</span>
                                            <Switch checked={showNames} onCheckedChange={setShowNames} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700">Arka plan animasyonu</span>
                                            <Switch checked={bgAnimation} onCheckedChange={setBgAnimation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </Tabs>
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
        </div>
    );
}
