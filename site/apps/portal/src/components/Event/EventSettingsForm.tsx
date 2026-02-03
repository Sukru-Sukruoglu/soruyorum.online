import React, { useState } from 'react';
import '@/styles/event-settings-form.css';

// Theme type for THEME_CATEGORIES
interface ThemeOption {
    id: string;
    name: string;
    primaryColor: string;
    backgroundColor?: string;
    background?: string;
}

interface ThemeCategory {
    id: string;
    name: string;
    themes: ThemeOption[];
}

const fixUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    const prodDomain = (() => {
        if (typeof window === 'undefined') return 'https://mobil.ksinteraktif.com';
        const host = (window.location.hostname || '').toLowerCase();
        if (host.includes('soruyorum.online')) return 'https://mobil.soruyorum.online';
        if (host.includes('ksinteraktif.com')) return 'https://mobil.ksinteraktif.com';
        const variant = (process.env.NEXT_PUBLIC_SITE_VARIANT || '').toLowerCase();
        if (variant === 'soruyorum') return 'https://mobil.soruyorum.online';
        return 'https://mobil.ksinteraktif.com';
    })();
    return url.replace(/https?:\/\/localhost:300[12]/g, prodDomain);
};

interface EventSettingsFormProps {
    onSave: (settings: EventFormData) => void;
    onCancel: () => void;
    initialTemplate?: 'tombala' | 'quiz' | 'poll' | 'wheel' | 'ranking' | 'wordcloud' | 'matching';
    displayTitle?: string;
    initialData?: EventFormData; // Support for editing
}

export interface EventFormData {
    id?: string; // Optional ID for updates
    title: string;
    description?: string;
    eventType: 'quiz' | 'poll' | 'tombala' | 'wheel' | 'ranking' | 'wordcloud' | 'matching';
    maxParticipants: number;
    // New fields for pre-generation
    eventPin?: string;
    joinUrl?: string;
    qrCodeUrl?: string;
    settings: {
        registration: {
            requirePin: boolean;
            requireName: boolean;
            requireEmail: boolean;
            requirePhone: boolean;
            requireAvatar: boolean;
            requireId: boolean;
            allowAnonymous: boolean;
            requireKvkkConsent: boolean;
        };
        gameplay: {
            autoMarkNumbers: boolean;
            autoStartEvent: boolean;
            showHostInfo: boolean;
            canHostReset: boolean;
            stepManager?: 'admin' | 'moderator';
            startDateTime?: string;
        };
        // Difficulty settings (for quiz, matching)
        difficulty?: {
            level: 'easy' | 'medium' | 'hard';
            timeLimit?: number; // seconds per question
            showHints?: boolean;
        };
        // Avatar settings
        avatar?: {
            enabled: boolean;
            style: 'emoji' | 'avatar' | 'initials' | 'photo';
            allowCustom: boolean;
        };
        // Rewards settings
        rewards?: {
            enabled: boolean;
            showLeaderboard: boolean;
            pointsPerCorrect?: number;
            bonusForSpeed?: boolean;
        };
        // Theme settings
        theme?: {
            primaryColor: string;
            backgroundColor: string;
            style: string; // Theme ID from THEME_CATEGORIES
            logoUrl?: string;
            backgroundImage?: string;
            fontFamily?: string;
            colorPalette?: string;
        };
        // Wheel Specific
        wheel?: {
            enableAccessCodes: boolean;
            requireIdentityNumber: boolean;
            codeCount?: number; // New field for initial generation
            wheelSize?: number;
            spinDuration?: number;
        };
        // Matching Specific
        matching?: {
            levels: {
                id: number;
                name: string;
                grid: string;
                description: string;
                active: boolean;
            }[];
        };
    };
}

// Cloudflare Images base URL - soruyorum variant (1920x1080 yüksek kalite)
const CF_IMG = 'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ';
const CF_VARIANT = 'soruyorum'; // 1920x1080 variant

// Kahoot benzeri tema kategorileri - Cloudflare CDN ile yüksek kalite
const THEME_CATEGORIES: ThemeCategory[] = [
    {
        id: 'solid',
        name: 'Düz Renkler',
        themes: [
            { id: 'purple', name: 'Mor', primaryColor: '#6366f1', backgroundColor: '#4f46e5' },
            { id: 'blue', name: 'Mavi', primaryColor: '#3b82f6', backgroundColor: '#2563eb' },
            { id: 'green', name: 'Yeşil', primaryColor: '#22c55e', backgroundColor: '#16a34a' },
            { id: 'red', name: 'Kırmızı', primaryColor: '#ef4444', backgroundColor: '#dc2626' },
            { id: 'orange', name: 'Turuncu', primaryColor: '#f97316', backgroundColor: '#ea580c' },
            { id: 'pink', name: 'Pembe', primaryColor: '#ec4899', backgroundColor: '#db2777' },
            { id: 'teal', name: 'Turkuaz', primaryColor: '#14b8a6', backgroundColor: '#0d9488' },
            { id: 'dark', name: 'Koyu', primaryColor: '#6366f1', backgroundColor: '#1f2937' },
        ]
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
];

export default function EventSettingsForm({
    onSave,
    onCancel,
    initialTemplate = 'tombala',
    displayTitle,
    initialData,
}: EventSettingsFormProps) {
    const [activeTab, setActiveTab] = useState<'flow' | 'info' | 'registration' | 'theme'>('info');
    const [selectedThemeCategory, setSelectedThemeCategory] = useState('solid');
    
    // Tema Özelleştir Modal State
    const [showCustomThemeModal, setShowCustomThemeModal] = useState(false);
    const [customTheme, setCustomTheme] = useState({
        logoUrl: '',
        backgroundImage: '',
        fontFamily: 'Inter',
        colorPalette: 'koyu',
    });

    // Renk Paletleri
    const COLOR_PALETTES = [
        { id: 'koyu', name: 'Koyu', colors: ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#6b7280', '#000000'] },
        { id: 'acik', name: 'Açık', colors: ['#fca5a5', '#93c5fd', '#86efac', '#d8b4fe', '#d1d5db', '#f3f4f6'] },
        { id: 'sicak', name: 'Sıcak', colors: ['#ef4444', '#f97316', '#fbbf24', '#f59e0b', '#dc2626', '#b91c1c'] },
        { id: 'soguk', name: 'Soğuk', colors: ['#3b82f6', '#0ea5e9', '#06b6d4', '#8b5cf6', '#6366f1', '#14b8a6'] },
        { id: 'doga', name: 'Doğa', colors: ['#22c55e', '#16a34a', '#15803d', '#84cc16', '#65a30d', '#4ade80'] },
    ];

    // Yazı Tipleri
    const FONT_FAMILIES = [
        { id: 'Inter', name: 'Inter (Varsayılan)' },
        { id: 'Montserrat', name: 'Montserrat' },
        { id: 'Poppins', name: 'Poppins' },
        { id: 'Roboto', name: 'Roboto' },
        { id: 'Open Sans', name: 'Open Sans' },
        { id: 'Nunito', name: 'Nunito' },
    ];

    const defaultMatchingLevels: NonNullable<EventFormData['settings']['matching']>['levels'] = [
        { id: 1, name: 'Seviye 1', grid: '4x4', description: '4x4 kart gridi ile başlangıç seviyesi.', active: true },
        { id: 2, name: 'Seviye 2', grid: '5x4', description: '5x4 kart gridi ile orta seviye.', active: false },
        { id: 3, name: 'Seviye 3', grid: '6x5', description: '6x5 kart gridi ile zor seviye.', active: false },
    ];

    const normalizeMatchingLevels = (
        levels: NonNullable<EventFormData['settings']['matching']>['levels']
    ): NonNullable<EventFormData['settings']['matching']>['levels'] => {
        if (!Array.isArray(levels) || levels.length === 0) return defaultMatchingLevels;

        const activeLevels = levels.filter((l) => l?.active);
        if (activeLevels.length === 1) return levels;

        const selectedId = activeLevels[0]?.id ?? levels[0]?.id ?? 1;
        return levels.map((l) => ({ ...l, active: l.id === selectedId }));
    };

    const [formData, setFormData] = useState<EventFormData>(() => {
        if (initialData) {
            const existingLevels = initialData.settings?.matching?.levels;

            const existingGameplay = (initialData.settings as any)?.gameplay || {};
            const stepManager: 'admin' | 'moderator' =
                existingGameplay.stepManager === 'moderator'
                    ? 'moderator'
                    : existingGameplay.stepManager === 'admin'
                        ? 'admin'
                        : // Legacy fallback: if old toggle was enabled, treat as admin.
                        existingGameplay.showHostInfo
                            ? 'admin'
                            : 'admin';

            return {
                ...initialData,
                title: (initialData as any).title ?? (initialData as any).name ?? '',
                eventPin:
                    (initialData as any).eventPin ??
                    (initialData as any).event_pin ??
                    (initialData as any).pin ??
                    undefined,
                joinUrl: (initialData as any).joinUrl ?? (initialData as any).join_url ?? undefined,
                qrCodeUrl: (initialData as any).qrCodeUrl ?? (initialData as any).qr_code_url ?? undefined,
                settings: {
                    ...initialData.settings,
                    gameplay: {
                        ...existingGameplay,
                        stepManager,
                    },
                    matching: {
                        levels: normalizeMatchingLevels(
                            Array.isArray(existingLevels) && existingLevels.length > 0 ? existingLevels : defaultMatchingLevels
                        ),
                    },
                },
            };
        }

        return {
        title: '',
        description: '',
        eventType: initialTemplate,
        maxParticipants: 100,
        settings: {
            registration: {
                requirePin: true,
                requireName: true,
                requireEmail: false,
                requirePhone: false,
                requireAvatar: true,
                requireId: false,
                allowAnonymous: false,
                requireKvkkConsent: false,
            },
            gameplay: {
                autoMarkNumbers: false,
                autoStartEvent: false,
                showHostInfo: false,
                canHostReset: false,
                stepManager: 'admin',
            },
            difficulty: {
                level: 'medium',
                timeLimit: 30,
                showHints: false,
            },
            avatar: {
                enabled: true,
                style: 'emoji',
                allowCustom: true,
            },
            rewards: {
                enabled: true,
                showLeaderboard: true,
                pointsPerCorrect: 100,
                bonusForSpeed: true,
            },
            theme: {
                primaryColor: '#6366f1',
                backgroundColor: '#ffffff',
                style: 'default',
            },
            wheel: {
                enableAccessCodes: false,
                requireIdentityNumber: false,
                codeCount: 50, // Default
            },
            matching: {
                levels: normalizeMatchingLevels(defaultMatchingLevels),
            },
        },
        };
    });

    // Auto-generate PIN only for new events (not editing)
    React.useEffect(() => {
        if (initialData) return;
        if (!formData.eventPin) {
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            // Prefer current host (supports soruyorum.online deployments).
            const origin = (typeof window !== 'undefined' && window.location?.origin)
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.soruyorum.online');
            const joinUrl = `${origin}/join?pin=${pin}`;

            setFormData(prev => ({
                ...prev,
                eventPin: pin,
                joinUrl: joinUrl,
                // QR is generated server-side on save (data URL), so we don't depend on external QR services here.
                qrCodeUrl: ''
            }));
        }
    }, [formData.eventPin, initialData]);

    const qrPreviewUrl = React.useMemo(() => {
        const joinUrl = fixUrl(formData.joinUrl);
        if (!joinUrl) return '';
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
    }, [formData.joinUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Etkinlik başlığı zorunludur');
            return;
        }

        onSave(formData);
    };

    const updateGameplaySetting = (key: keyof typeof formData.settings.gameplay, value: any) => {
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                gameplay: {
                    ...formData.settings.gameplay,
                    [key]: value,
                },
            },
        });
    };

    const updateRegistrationSetting = (key: keyof typeof formData.settings.registration, value: boolean) => {
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                registration: {
                    ...formData.settings.registration,
                    [key]: value,
                },
            },
        });
    };

    const updateMatchingSetting = (key: keyof NonNullable<EventFormData['settings']['matching']>, value: any) => {
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                matching: {
                    ...formData.settings.matching!,
                    [key]: value,
                }
            }
        });
    };

    const updateWheelSetting = (key: 'enableAccessCodes' | 'requireIdentityNumber' | 'codeCount', value: any) => {
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                wheel: {
                    ...formData.settings.wheel!,
                    [key]: value,
                }
            }
        });
    };

    const updateLevelSetting = (index: number, key: string, value: any) => {
        const newLevels = [...(formData.settings.matching?.levels || [])];
        if (newLevels[index]) {
            newLevels[index] = { ...newLevels[index], [key]: value };
            updateMatchingSetting('levels', newLevels);
        }
    };

    const selectMatchingLevel = (levelId: number) => {
        const levels = formData.settings.matching?.levels ?? defaultMatchingLevels;
        updateMatchingSetting(
            'levels',
            normalizeMatchingLevels(levels.map((l) => ({ ...l, active: l.id === levelId })))
        );
    };

    return (
        <div className="event-settings-form">
            {/* Header */}
            <div className="settings-header">
                <h2 className="uppercase">{displayTitle || `${initialTemplate} - Etkinlik Oluştur`}</h2>
                <p className="settings-subtitle">Etkinliklerim</p>
            </div>

            {/* Başlık Input */}


            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button
                    className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                    type="button"
                >
                    Bilgiler
                </button>
                <button
                    className={`tab ${activeTab === 'flow' ? 'active' : ''}`}
                    onClick={() => setActiveTab('flow')}
                    type="button"
                >
                    Akış
                </button>
                <button
                    className={`tab ${activeTab === 'registration' ? 'active' : ''}`}
                    onClick={() => setActiveTab('registration')}
                    type="button"
                    style={{ display: initialTemplate === 'wheel' ? 'none' : 'block' }}
                >
                    Kayıt
                </button>
                <button
                    className={`tab ${activeTab === 'theme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                    type="button"
                >
                    Tema
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ============================================ */}
                {/* AKIŞ TAB */}
                {/* ============================================ */}
                {activeTab === 'flow' && (
                    <div className="tab-content">
                        <div className="toggle-group">
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>Etkinlik adımlarını kim yönetsin?</label>
                                <select
                                    value={formData.settings.gameplay.stepManager || 'admin'}
                                    onChange={(e) =>
                                        updateGameplaySetting(
                                            'stepManager' as any,
                                            (e.target.value === 'moderator' ? 'moderator' : 'admin')
                                        )
                                    }
                                >
                                    <option value="admin">Etkinlik adımlarını Admin yönetsin</option>
                                    <option value="moderator">Etkinlik adımlarını Moderator yönetsin</option>
                                </select>
                                <p className="field-hint">Adım/akış kontrolünün kimde olacağını belirler.</p>
                            </div>

                            <ToggleItem
                                label="Sunucu etkinliği sıfırlayabilsin"
                                checked={formData.settings.gameplay.canHostReset}
                                onChange={(checked) => updateGameplaySetting('canHostReset', checked)}
                            />

                            {/* TOMBALA SPECIFIC */}
                            {initialTemplate === 'tombala' && (
                                <ToggleItem
                                    label="Çıkan sayılar otomatik işaretlensin"
                                    checked={formData.settings.gameplay.autoMarkNumbers}
                                    onChange={(checked) => updateGameplaySetting('autoMarkNumbers', checked)}
                                />
                            )}

                            {/* QUIZ SPECIFIC */}
                            {initialTemplate === 'quiz' && (
                                <ToggleItem
                                    label="Cevaplar otomatik gösterilsin"
                                    checked={false} // Placeholder for now
                                    onChange={() => { }}
                                    disabled={true} // Disabled until implemented
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* BİLGİLER TAB */}
                {/* ============================================ */}
                {activeTab === 'info' && (
                    <div className="tab-content">
                        <div className="title-section mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Başlık *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Etkinlik başlığı (zorunlu)"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <p className="tab-description">
                            Katılımcı limitini buradan belirleyebilirsiniz.
                        </p>
                        <p className="tab-note">
                            Değişiklikleri kaydetmek için "Kaydet & Devam Et" butonuna tıklayın.
                        </p>
                        <p className="tab-note" style={{ marginBottom: '24px' }}>
                            Proje: Kaydetmeden çıkarsanız etkinlik oluşturulmaz.
                        </p>

                        {/* Katılımcı Limiti - Hide for Wheel */}
                        {initialTemplate !== 'wheel' && (
                            <div className="form-group">
                                <label>* Katılımcı Limiti</label>
                                <input
                                    type="number"
                                    value={formData.maxParticipants}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            maxParticipants: parseInt(e.target.value) || 100,
                                        })
                                    }
                                    min={1}
                                    max={10000}
                                />
                                <p className="field-hint">
                                    Bu limit, mobil kayıt ekranında katılımcı sayısını sınırlar.
                                </p>
                            </div>
                        )}

                        {/* Hediye Çarkı Güvenlik (Moved to Info for Wheel) */}
                        {initialTemplate === 'wheel' && (
                            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-6">
                                <p className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                    🛡️ Hediye Çarkı Güvenlik
                                </p>
                                <ToggleItem
                                    label="Şifreli Giriş (Sadece kodu olanlar girebilir)"
                                    checked={formData.settings.wheel?.enableAccessCodes || false}
                                    onChange={(checked) => updateWheelSetting('enableAccessCodes', checked)}
                                />

                                {/* Code Count Input - Visible only if Access Codes enabled */}
                                {formData.settings.wheel?.enableAccessCodes && (
                                    <div className="ml-12 mb-4 bg-white border border-amber-200 rounded-lg p-3">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Üretilecek Şifre Limiti
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="1000"
                                                value={formData.settings.wheel?.codeCount || 50}
                                                onChange={(e) => updateWheelSetting('codeCount', parseInt(e.target.value) || 0)}
                                                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900"
                                            />
                                            <span className="text-xs text-gray-500">Adet (Maks: 1000)</span>
                                        </div>
                                    </div>
                                )}

                                <ToggleItem
                                    label="TC Kimlik No (Zorunlu)"
                                    checked={formData.settings.wheel?.requireIdentityNumber || false}
                                    onChange={(checked) => updateWheelSetting('requireIdentityNumber', checked)}
                                />

                                <div className="my-2 border-t border-amber-200/50"></div>

                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'İsim Soyisim' alanı olsun"
                                    checked={formData.settings.registration.requireName}
                                    onChange={(checked) => updateRegistrationSetting('requireName', checked)}
                                />

                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'E-Posta' alanı olsun"
                                    checked={formData.settings.registration.requireEmail}
                                    onChange={(checked) => updateRegistrationSetting('requireEmail', checked)}
                                />

                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'Telefon' alanı olsun"
                                    checked={formData.settings.registration.requirePhone}
                                    onChange={(checked) => updateRegistrationSetting('requirePhone', checked)}
                                />
                            </div>
                        )}

                        {/* PIN Info */}
                        <div className="info-section">
                            <p className="info-label">* PIN</p>
                            <input
                                type="text"
                                value={formData.eventPin || "Oluşturuluyor..."}
                                readOnly
                                className="info-input border border-gray-300 bg-gray-50 text-gray-900 font-bold rounded p-2 w-full font-mono text-lg tracking-wider"
                            />
                            <p className="field-hint mt-1 text-xs">
                                Bu PIN otomatik oluşturulmuştur ve etkinlik kaydedildiğinde kesinleşecektir.
                            </p>
                        </div>

                        {/* Katılımcı Linki Info */}
                        <div className="info-section">
                            <p className="info-label">Katılımcı Linki (PIN'li)</p>
                            <input
                                type="text"
                                value={fixUrl(formData.joinUrl) || "Oluşturuluyor..."}
                                readOnly
                                className="info-input border border-gray-300 bg-gray-50 text-gray-700 font-medium rounded p-2 w-full text-sm font-mono"
                            />
                        </div>

                        {/* QR Info */}
                        <div className="info-section">
                            <p className="info-label">QR</p>
                            <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col items-center justify-center gap-3">
                                {(formData.qrCodeUrl || qrPreviewUrl) ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={fixUrl(formData.qrCodeUrl) || qrPreviewUrl} alt="QR Kod Önizleme" className="w-32 h-32 object-contain mix-blend-multiply" />
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Katılım Kodu</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-widest leading-none mt-1">{formData.eventPin}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center text-gray-400 text-sm">QR Oluşturuluyor...</div>
                                )}
                            </div>
                        </div>

                        {/* Başlangıç Tarihi */}
                        <div className="form-group">
                            <label>Başlangıç Tarihi</label>
                            <input
                                type="datetime-local"
                                value={formData.settings.gameplay.startDateTime || ''}
                                onChange={(e) => updateGameplaySetting('startDateTime', e.target.value)}
                            />
                            <p className="field-hint">GMT +03:00</p>
                            <div className="datetime-actions">
                                <button
                                    type="button"
                                    className="btn-datetime"
                                    onClick={() => {
                                        const date = new Date();
                                        date.setMinutes(date.getMinutes() + 30);
                                        // Timezone handling kept simple as per request
                                        const isoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                        updateGameplaySetting('startDateTime', isoString);
                                    }}
                                >
                                    30 dakika sonrasına ayarla
                                </button>
                                <button
                                    type="button"
                                    className="btn-datetime"
                                    onClick={() => updateGameplaySetting('startDateTime', undefined)}
                                >
                                    Tarihi kaldır
                                </button>
                            </div>
                        </div>

                        {/* Otomatik Başlat */}
                        <div className="toggle-group" style={{ marginTop: '24px' }}>
                            <ToggleItem
                                label="Etkinlik otomatik başlasın"
                                checked={formData.settings.gameplay.autoStartEvent}
                                onChange={(checked) => updateGameplaySetting('autoStartEvent', checked)}
                            />
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* KAYIT TAB */}
                {/* ============================================ */}
                {activeTab === 'registration' && (
                    <div className="tab-content">
                        <p className="tab-description">
                            Değişiklikleri kaydetmek için "Kaydet & Devam Et" butonuna tıklayın.
                        </p>

                        <div className="toggle-group">
                            {initialTemplate !== 'wheel' && (
                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'PIN ile giriş' olsun"
                                    checked={formData.settings.registration.requirePin}
                                    onChange={(checked) => updateRegistrationSetting('requirePin', checked)}
                                />
                            )}

                            <ToggleItem
                                label="Katılımcı kayıt işleminde 'İsim Soyisim' alanı olsun"
                                checked={formData.settings.registration.requireName}
                                onChange={(checked) => updateRegistrationSetting('requireName', checked)}
                            />

                            {initialTemplate !== 'wheel' && (
                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'Avatar' alanı olsun"
                                    checked={formData.settings.registration.requireAvatar}
                                    onChange={(checked) => updateRegistrationSetting('requireAvatar', checked)}
                                />
                            )}

                            <ToggleItem
                                label="Katılımcı kayıt işleminde 'E-Posta' alanı olsun"
                                checked={formData.settings.registration.requireEmail}
                                onChange={(checked) => updateRegistrationSetting('requireEmail', checked)}
                            />

                            <ToggleItem
                                label="Katılımcı kayıt işleminde 'Telefon' alanı olsun"
                                checked={formData.settings.registration.requirePhone}
                                onChange={(checked) => updateRegistrationSetting('requirePhone', checked)}
                            />

                            {initialTemplate !== 'wheel' && (
                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'ID' alanı olsun"
                                    checked={formData.settings.registration.requireId}
                                    onChange={(checked) => updateRegistrationSetting('requireId', checked)}
                                />
                            )}

                            {initialTemplate !== 'wheel' && (
                                <ToggleItem
                                    label="Anonim kayıt yapılabilsin"
                                    checked={formData.settings.registration.allowAnonymous}
                                    onChange={(checked) => updateRegistrationSetting('allowAnonymous', checked)}
                                />
                            )}

                            {initialTemplate !== 'wheel' && (
                                <ToggleItem
                                    label="Katılımcı kayıt işleminde 'KVKK Onayı' olsun"
                                    checked={formData.settings.registration.requireKvkkConsent}
                                    onChange={(checked) => updateRegistrationSetting('requireKvkkConsent', checked)}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* TEMA TAB */}
                {/* ============================================ */}
                {activeTab === 'theme' && (
                    <div className="tab-content">
                        <p className="tab-description">
                            Etkinliğin görsel temasını seçin.
                        </p>

                        {/* Özel Tema Oluştur Butonu + Kategori Tabları */}
                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                            <button
                                type="button"
                                onClick={() => setShowCustomThemeModal(true)}
                                className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
                            >
                                ✨ Özel Tema Oluştur
                            </button>
                            {THEME_CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setSelectedThemeCategory(category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                        selectedThemeCategory === category.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {/* Tema Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {THEME_CATEGORIES.find(c => c.id === selectedThemeCategory)?.themes.map((theme) => {
                                const isSelected = formData.settings.theme?.style === theme.id;
                                const hasBackground = 'background' in theme && theme.background;
                                
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => {
                                            const isImageBackground = hasBackground && (theme.background.startsWith('/') || theme.background.startsWith('http'));
                                            setFormData(prev => ({
                                                ...prev,
                                                settings: {
                                                    ...prev.settings,
                                                    theme: {
                                                        ...prev.settings.theme,
                                                        style: theme.id,
                                                        primaryColor: theme.primaryColor,
                                                        // Resim yolu ise background olarak, değilse backgroundColor olarak kaydet
                                                        background: isImageBackground ? theme.background : undefined,
                                                        backgroundImage: isImageBackground ? theme.background : undefined,
                                                        backgroundColor: !isImageBackground ? ((theme as any).backgroundColor || theme.primaryColor) : undefined,
                                                    },
                                                },
                                            }));
                                        }}
                                        className={`relative aspect-video rounded-xl overflow-hidden border-3 transition-all ${
                                            isSelected
                                                ? 'border-indigo-500 ring-2 ring-indigo-300 scale-105'
                                                : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                                        }`}
                                    >
                                        {hasBackground ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${theme.background})` }}
                                            >
                                                <div className="absolute inset-0 bg-black/20" />
                                            </div>
                                        ) : (
                                            <div
                                                className="absolute inset-0"
                                                style={{ backgroundColor: (theme as any).backgroundColor || theme.primaryColor }}
                                            />
                                        )}
                                        
                                        {/* Tema adı */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                            <span className="text-white text-sm font-semibold drop-shadow-lg">
                                                {theme.name}
                                            </span>
                                        </div>
                                        
                                        {/* Seçili işareti */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Seçili tema önizleme */}
                        {formData.settings.theme?.style && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Seçili Tema</h4>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-lg"
                                        style={{ backgroundColor: formData.settings.theme?.primaryColor || '#6366f1' }}
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {THEME_CATEGORIES.flatMap(c => c.themes).find(t => t.id === formData.settings.theme?.style)?.name || 'Mor'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Ana renk: {formData.settings.theme?.primaryColor || '#6366f1'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomThemeModal(true)}
                                        className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Özelleştir
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================ */}
                {/* TEMA ÖZELLEŞTİR MODAL */}
                {/* ============================================ */}
                {showCustomThemeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Tema Özelleştir</h3>
                                
                                {/* Önizleme */}
                                <div 
                                    className="relative w-full aspect-video rounded-xl overflow-hidden mb-6 bg-cover bg-center"
                                    style={{ 
                                        backgroundImage: customTheme.backgroundImage 
                                            ? `url(${customTheme.backgroundImage})` 
                                            : formData.settings.theme?.backgroundColor?.startsWith('/') 
                                                ? `url(${formData.settings.theme.backgroundColor})`
                                                : undefined,
                                        backgroundColor: !customTheme.backgroundImage && !formData.settings.theme?.backgroundColor?.startsWith('/') 
                                            ? (formData.settings.theme?.backgroundColor || '#6366f1') 
                                            : undefined,
                                    }}
                                >
                                    {customTheme.logoUrl && (
                                        <img 
                                            src={customTheme.logoUrl} 
                                            alt="Logo" 
                                            className="absolute top-4 left-4 h-12 object-contain"
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold drop-shadow-lg" style={{ fontFamily: customTheme.fontFamily }}>
                                            Önizleme
                                        </span>
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
                                    <div className="flex items-center gap-3">
                                        {customTheme.logoUrl ? (
                                            <div className="relative">
                                                <img src={customTheme.logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomTheme(prev => ({ ...prev, logoUrl: '' }));
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            settings: {
                                                                ...prev.settings,
                                                                theme: {
                                                                    ...prev.settings.theme,
                                                                    logoUrl: '',
                                                                },
                                                            },
                                                        }));
                                                    }}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                                                <span className="text-2xl text-gray-400">+</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (ev) => {
                                                                const logoUrl = ev.target?.result as string;
                                                                setCustomTheme(prev => ({ ...prev, logoUrl }));
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    settings: {
                                                                        ...prev.settings,
                                                                        theme: {
                                                                            ...prev.settings.theme,
                                                                            logoUrl,
                                                                        },
                                                                    },
                                                                }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Arka Plan Resmi */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Arka Plan Resmi</label>
                                    <div className="flex items-center gap-3">
                                        {(customTheme.backgroundImage || formData.settings.theme?.backgroundColor?.startsWith('/')) && (
                                            <img 
                                                src={customTheme.backgroundImage || formData.settings.theme?.backgroundColor} 
                                                alt="Arka plan" 
                                                className="w-16 h-12 object-cover border rounded-lg" 
                                            />
                                        )}
                                        <label className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-indigo-600">
                                            <span>Özel bir resim ekle</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const backgroundImage = ev.target?.result as string;
                                                            setCustomTheme(prev => ({ ...prev, backgroundImage }));
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                settings: {
                                                                    ...prev.settings,
                                                                    theme: {
                                                                        ...prev.settings.theme,
                                                                        backgroundImage,
                                                                    },
                                                                },
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Yazı Tipi */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Yazı Tipi</label>
                                    <select
                                        value={customTheme.fontFamily}
                                        onChange={(e) => {
                                            const fontFamily = e.target.value;
                                            setCustomTheme(prev => ({ ...prev, fontFamily }));
                                            setFormData(prev => ({
                                                ...prev,
                                                settings: {
                                                    ...prev.settings,
                                                    theme: {
                                                        ...prev.settings.theme,
                                                        fontFamily,
                                                    },
                                                },
                                            }));
                                        }}
                                        className="w-full p-3 border rounded-lg bg-white text-gray-900"
                                    >
                                        {FONT_FAMILIES.map(font => (
                                            <option key={font.id} value={font.id}>{font.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Renk Paleti */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Renk Paleti</label>
                                    <div className="space-y-2">
                                        {COLOR_PALETTES.map(palette => (
                                            <button
                                                key={palette.id}
                                                type="button"
                                                onClick={() => {
                                                    setCustomTheme(prev => ({ ...prev, colorPalette: palette.id }));
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        settings: {
                                                            ...prev.settings,
                                                            theme: {
                                                                ...prev.settings.theme,
                                                                colorPalette: palette.id,
                                                                primaryColor: palette.colors[0], // İlk rengi ana renk yap
                                                            },
                                                        },
                                                    }));
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                    customTheme.colorPalette === palette.id 
                                                        ? 'border-indigo-500 bg-indigo-50' 
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className="text-sm font-medium text-gray-700">{palette.name}</span>
                                                <div className="flex gap-1">
                                                    {palette.colors.map((color, idx) => (
                                                        <div 
                                                            key={idx}
                                                            className="w-6 h-6 rounded-full"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomThemeModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="settings-footer">
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        İptal
                    </button>
                    <button type="submit" className="btn-submit">
                        Kaydet & Devam Et
                    </button>
                </div>
            </form>
        </div>
    );
}

// ============================================
// TOGGLE ITEM COMPONENT (Reusable)
// ============================================
interface ToggleItemProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

function ToggleItem({ label, checked, onChange, disabled = false }: ToggleItemProps) {
    return (
        <div className={`toggle-item-wrapper ${disabled ? 'disabled' : ''}`}>
            <label className="toggle-item">
                <span className="toggle-label">{label}</span>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="toggle-switch"></span>
            </label>
        </div>
    );
}
