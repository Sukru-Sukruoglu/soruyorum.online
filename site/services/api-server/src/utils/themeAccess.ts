const DEFAULT_THEME_BG = 'https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/4f7f6fbe-cbf6-4b8f-4f0f-fe0255594400/soruyorum';

const LIMITED_GRADIENT_THEMES = {
    business: 'linear-gradient(135deg, #450a0a 0%, #dc2626 100%)',
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
} as const;

const LIMITED_THEME_IDS = new Set<string>(['featured1', ...Object.keys(LIMITED_GRADIENT_THEMES)]);
const LIMITED_GRADIENT_VALUES = new Set<string>(Object.values(LIMITED_GRADIENT_THEMES));
const DESIGN_KEYS = ['style', 'primaryColor', 'background', 'backgroundImage', 'backgroundColor'] as const;

type LimitedThemePreset = {
    style: string;
    primaryColor: string;
    background?: string;
    backgroundImage?: string;
};

const FEATURED_PRESET: LimitedThemePreset = {
    style: 'featured1',
    primaryColor: '#6366f1',
    backgroundImage: DEFAULT_THEME_BG,
};

function pickPrimaryFromGradient(gradient: string, fallback: string) {
    const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
    if (!matches || !matches.length) return fallback;
    return matches[matches.length - 1] || fallback;
}

function isRecord(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
}

function unwrapUrlValue(value: unknown): string | null {
    const raw = readString(value);
    if (!raw) return null;

    const match = raw.match(/^url\((.*)\)$/i);
    const unwrapped = match?.[1]?.trim() ?? raw;
    const normalized =
        (unwrapped.startsWith('"') && unwrapped.endsWith('"')) ||
        (unwrapped.startsWith("'") && unwrapped.endsWith("'"))
            ? unwrapped.slice(1, -1).trim()
            : unwrapped;

    return normalized || null;
}

function isImageValue(value: unknown) {
    const raw = unwrapUrlValue(value);
    if (!raw) return false;
    return raw.startsWith('/') || raw.startsWith('http') || raw.startsWith('data:image/');
}

function getGradientPreset(style: string): LimitedThemePreset | null {
    const background = LIMITED_GRADIENT_THEMES[style as keyof typeof LIMITED_GRADIENT_THEMES];
    if (!background) return null;
    return {
        style,
        primaryColor: pickPrimaryFromGradient(background, '#dc2626'),
        background,
    };
}

function resolveLimitedThemePreset(theme: unknown): LimitedThemePreset | null {
    if (!isRecord(theme)) return null;

    const style = readString(theme.style);
    if (style === FEATURED_PRESET.style) return { ...FEATURED_PRESET };
    if (style && LIMITED_THEME_IDS.has(style)) return getGradientPreset(style);

    const backgroundImage = unwrapUrlValue(theme.backgroundImage);
    if (backgroundImage === DEFAULT_THEME_BG) return { ...FEATURED_PRESET };

    const background = readString(theme.background);
    if (background && LIMITED_GRADIENT_VALUES.has(background)) {
        const matchedStyle = Object.entries(LIMITED_GRADIENT_THEMES).find(([, value]) => value === background)?.[0];
        if (matchedStyle) return getGradientPreset(matchedStyle);
    }

    const backgroundColorRaw = readString(theme.backgroundColor);
    if (backgroundColorRaw) {
        if (isImageValue(backgroundColorRaw) && unwrapUrlValue(backgroundColorRaw) === DEFAULT_THEME_BG) {
            return { ...FEATURED_PRESET };
        }

        if (LIMITED_GRADIENT_VALUES.has(backgroundColorRaw)) {
            const matchedStyle = Object.entries(LIMITED_GRADIENT_THEMES).find(([, value]) => value === backgroundColorRaw)?.[0];
            if (matchedStyle) return getGradientPreset(matchedStyle);
        }
    }

    return null;
}

export function themeTouchesDesignKeys(theme: unknown) {
    if (!isRecord(theme)) return false;
    return DESIGN_KEYS.some((key) => Object.prototype.hasOwnProperty.call(theme, key));
}

export function themeViolatesLimitedAccess(theme: unknown) {
    if (!themeTouchesDesignKeys(theme)) return false;
    if (!isRecord(theme)) return false;

    const preset = resolveLimitedThemePreset(theme);
    const style = readString(theme.style);
    const primaryColor = readString(theme.primaryColor);
    const background = readString(theme.background);
    const backgroundImage = unwrapUrlValue(theme.backgroundImage);
    const backgroundColor = readString(theme.backgroundColor);

    if (style && !LIMITED_THEME_IDS.has(style)) return true;

    if (backgroundImage && backgroundImage !== DEFAULT_THEME_BG) return true;
    if (background && !LIMITED_GRADIENT_VALUES.has(background)) return true;

    if (backgroundColor) {
        if (isImageValue(backgroundColor)) {
            if (unwrapUrlValue(backgroundColor) !== DEFAULT_THEME_BG) return true;
        } else if (!LIMITED_GRADIENT_VALUES.has(backgroundColor)) {
            return true;
        }
    }

    if (!preset) {
        return Boolean(style || primaryColor || background || backgroundImage || backgroundColor);
    }

    if (primaryColor && primaryColor !== preset.primaryColor) return true;

    if (preset.style === FEATURED_PRESET.style) {
        if (background) return true;
        if (backgroundColor && !isImageValue(backgroundColor)) return true;
        return false;
    }

    if (backgroundImage) return true;
    if (background && background !== preset.background) return true;
    if (backgroundColor && backgroundColor !== preset.background) return true;

    return false;
}

export function extractThemeDesignState(theme: unknown) {
    if (!isRecord(theme)) return {};

    const state: Record<string, string> = {};

    const style = readString(theme.style);
    if (style) state.style = style;

    const primaryColor = readString(theme.primaryColor);
    if (primaryColor) state.primaryColor = primaryColor;

    const background = readString(theme.background);
    if (background) state.background = background;

    const backgroundImage = unwrapUrlValue(theme.backgroundImage);
    if (backgroundImage) state.backgroundImage = backgroundImage;

    const backgroundColor = readString(theme.backgroundColor);
    if (backgroundColor) {
        state.backgroundColor = isImageValue(backgroundColor)
            ? (unwrapUrlValue(backgroundColor) || backgroundColor)
            : backgroundColor;
    }

    return state;
}

export function themeDesignStateDiffers(a: unknown, b: unknown) {
    return JSON.stringify(extractThemeDesignState(a)) !== JSON.stringify(extractThemeDesignState(b));
}

export function sanitizeThemeForLimitedAccess(theme: unknown) {
    const nextTheme = isRecord(theme) ? { ...theme } : {};
    const preset = resolveLimitedThemePreset(nextTheme) || { ...FEATURED_PRESET };

    nextTheme.style = preset.style;
    nextTheme.primaryColor = preset.primaryColor;

    if (preset.background) nextTheme.background = preset.background;
    else delete nextTheme.background;

    if (preset.backgroundImage) nextTheme.backgroundImage = preset.backgroundImage;
    else delete nextTheme.backgroundImage;

    delete nextTheme.backgroundColor;

    return nextTheme;
}

export function sanitizeSettingsForLimitedAccess(settings: unknown) {
    if (!isRecord(settings)) return settings;
    return {
        ...settings,
        theme: sanitizeThemeForLimitedAccess(settings.theme),
    };
}
