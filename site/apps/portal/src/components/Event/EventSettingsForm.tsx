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

// Kahoot benzeri tema kategorileri
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
            { id: 'festival', name: 'Festival', background: '/images/themes/festival.jpg', primaryColor: '#f59e0b' },
            { id: 'birthday', name: 'Doğum Günü', background: '/images/themes/birthday.jpg', primaryColor: '#ec4899' },
            { id: 'wedding', name: 'Düğün', background: '/images/themes/wedding.jpg', primaryColor: '#f472b6' },
            { id: 'ramadan', name: 'Ramazan', background: '/images/themes/ramadan.jpg', primaryColor: '#fbbf24' },
            { id: 'newyear', name: 'Yılbaşı', background: '/images/themes/newyear.jpg', primaryColor: '#fcd34d' },
        ]
    },
    {
        id: 'confetti',
        name: '🎊 Konfeti',
        themes: [
            { id: 'confetti', name: 'Konfeti 1', background: '/images/themes/confetti.jpg', primaryColor: '#8b5cf6' },
            { id: 'confetti3', name: 'Konfeti 2', background: '/images/themes/confetti3.jpg', primaryColor: '#ec4899' },
            { id: 'confetti4', name: 'Konfeti 3', background: '/images/themes/confetti4.jpg', primaryColor: '#06b6d4' },
            { id: 'confetti5', name: 'Konfeti 4', background: '/images/themes/confetti5.jpg', primaryColor: '#f59e0b' },
            { id: 'confetti6', name: 'Konfeti 5', background: '/images/themes/confetti6.jpg', primaryColor: '#22c55e' },
        ]
    },
    {
        id: 'balloon',
        name: '🎈 Balon',
        themes: [
            { id: 'balloon1', name: 'Renkli Balonlar', background: '/images/themes/balloon1.jpg', primaryColor: '#ef4444' },
            { id: 'balloon2', name: 'Parti Balonları', background: '/images/themes/balloon2.jpg', primaryColor: '#8b5cf6' },
            { id: 'balloon3', name: 'Altın Balonlar', background: '/images/themes/balloon3.jpg', primaryColor: '#fbbf24' },
        ]
    },
    {
        id: 'nature',
        name: '🌿 Doğa',
        themes: [
            { id: 'sunset', name: 'Gün Batımı', background: '/images/themes/sunset1.jpg', primaryColor: '#f97316' },
            { id: 'ocean', name: 'Okyanus', background: '/images/themes/ocean.jpg', primaryColor: '#0ea5e9' },
            { id: 'forest', name: 'Orman', background: '/images/themes/forest.jpg', primaryColor: '#22c55e' },
            { id: 'autumn', name: 'Sonbahar', background: '/images/themes/autumn.jpg', primaryColor: '#ea580c' },
            { id: 'night', name: 'Gece', background: '/images/themes/night.jpg', primaryColor: '#6366f1' },
            { id: 'spring', name: 'İlkbahar', background: '/images/themes/spring.jpg', primaryColor: '#84cc16' },
            { id: 'beach', name: 'Sahil', background: '/images/themes/beach.jpg', primaryColor: '#0ea5e9' },
            { id: 'mountain', name: 'Dağ', background: '/images/themes/mountain.jpg', primaryColor: '#64748b' },
        ]
    },
    {
        id: 'professional',
        name: '💼 Profesyonel',
        themes: [
            { id: 'corporate', name: 'Kurumsal', background: '/images/themes/corporate.jpg', primaryColor: '#3b82f6' },
            { id: 'minimal', name: 'Minimal', background: '/images/themes/minimal.jpg', primaryColor: '#64748b' },
            { id: 'elegant', name: 'Zarif', background: '/images/themes/elegant.jpg', primaryColor: '#a855f7' },
            { id: 'modern', name: 'Modern', background: '/images/themes/modern.jpg', primaryColor: '#06b6d4' },
            { id: 'tech', name: 'Teknoloji', background: '/images/themes/tech.jpg', primaryColor: '#22d3ee' },
        ]
    },
    {
        id: 'sports',
        name: '⚽ Spor',
        themes: [
            { id: 'football', name: 'Futbol', background: '/images/themes/football.jpg', primaryColor: '#22c55e' },
            { id: 'basketball', name: 'Basketbol', background: '/images/themes/basketball.jpg', primaryColor: '#f97316' },
            { id: 'fitness', name: 'Fitness', background: '/images/themes/fitness.jpg', primaryColor: '#ef4444' },
        ]
    },
    {
        id: 'education',
        name: '📚 Eğitim',
        themes: [
            { id: 'school', name: 'Okul', background: '/images/themes/school.jpg', primaryColor: '#3b82f6' },
            { id: 'science', name: 'Bilim', background: '/images/themes/science.jpg', primaryColor: '#8b5cf6' },
            { id: 'art', name: 'Sanat', background: '/images/themes/art.jpg', primaryColor: '#ec4899' },
            { id: 'math', name: 'Matematik', background: '/images/themes/math.jpg', primaryColor: '#14b8a6' },
            { id: 'music', name: 'Müzik', background: '/images/themes/music.jpg', primaryColor: '#f59e0b' },
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

                        {/* Kategori Tabları */}
                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
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
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            settings: {
                                                ...prev.settings,
                                                theme: {
                                                    ...prev.settings.theme,
                                                    style: theme.id,
                                                    primaryColor: theme.primaryColor,
                                                    backgroundColor: hasBackground ? theme.background : (theme as any).backgroundColor || theme.primaryColor,
                                                },
                                            },
                                        }))}
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
                                </div>
                            </div>
                        )}
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
