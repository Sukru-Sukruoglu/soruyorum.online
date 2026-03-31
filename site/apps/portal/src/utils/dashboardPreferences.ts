export type DashboardTheme = "light" | "dark" | "system";
export type DashboardFontSize = "small" | "medium" | "large";
export type ResolvedDashboardTheme = "light" | "dark";

export const DASHBOARD_THEME_STORAGE_KEY = "ks-theme";
export const DASHBOARD_FONT_SIZE_STORAGE_KEY = "ks-font-size";

const FONT_SIZE_MAP: Record<DashboardFontSize, string> = {
    small: "15px",
    medium: "16px",
    large: "17px",
};

const DARK_THEME_VARS = {
    "--dashboard-shell-bg": "#0B192C",
    "--dashboard-shell-surface": "linear-gradient(180deg, #0B192C 0%, #0f2035 50%, #0B192C 100%)",
    "--dashboard-panel-bg": "rgba(255,255,255,0.05)",
    "--dashboard-panel-alt-bg": "rgba(255,255,255,0.03)",
    "--dashboard-panel-hover-bg": "rgba(255,255,255,0.08)",
    "--dashboard-border-color": "rgba(255,255,255,0.12)",
    "--dashboard-border-strong": "rgba(255,255,255,0.18)",
    "--dashboard-heading": "#ffffff",
    "--dashboard-text-primary": "#e2e8f0",
    "--dashboard-text-secondary": "#94a3b8",
    "--dashboard-text-muted": "#64748b",
    "--dashboard-nav-text": "#aaaaaa",
    "--dashboard-input-bg": "rgba(255,255,255,0.05)",
    "--dashboard-input-placeholder": "#64748b",
    "--dashboard-table-text": "#e2e8f0",
    "--dashboard-table-head": "#94a3b8",
    "--dashboard-backdrop-blur": "blur(8px)",
};

const LIGHT_THEME_VARS = {
    "--dashboard-shell-bg": "#f4f7fb",
    "--dashboard-shell-surface": "linear-gradient(180deg, #f7fafc 0%, #eef4fb 52%, #f7fafc 100%)",
    "--dashboard-panel-bg": "#ffffff",
    "--dashboard-panel-alt-bg": "#f8fafc",
    "--dashboard-panel-hover-bg": "#eef2f7",
    "--dashboard-border-color": "rgba(15,23,42,0.10)",
    "--dashboard-border-strong": "rgba(15,23,42,0.16)",
    "--dashboard-heading": "#0f172a",
    "--dashboard-text-primary": "#0f172a",
    "--dashboard-text-secondary": "#475569",
    "--dashboard-text-muted": "#64748b",
    "--dashboard-nav-text": "#475569",
    "--dashboard-input-bg": "#ffffff",
    "--dashboard-input-placeholder": "#94a3b8",
    "--dashboard-table-text": "#0f172a",
    "--dashboard-table-head": "#475569",
    "--dashboard-backdrop-blur": "none",
};

export function readStoredDashboardTheme(): DashboardTheme {
    if (typeof window === "undefined") return "dark";

    const stored = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
}

export function readStoredDashboardFontSize(): DashboardFontSize {
    if (typeof window === "undefined") return "medium";

    const stored = window.localStorage.getItem(DASHBOARD_FONT_SIZE_STORAGE_KEY);
    return stored === "small" || stored === "medium" || stored === "large" ? stored : "medium";
}

export function resolveDashboardTheme(theme: DashboardTheme): ResolvedDashboardTheme {
    if (theme !== "system") return theme;
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyDashboardPreferences(options?: {
    theme?: DashboardTheme;
    fontSize?: DashboardFontSize;
    persist?: boolean;
}) {
    if (typeof window === "undefined") return;

    const theme = options?.theme ?? readStoredDashboardTheme();
    const fontSize = options?.fontSize ?? readStoredDashboardFontSize();
    const persist = options?.persist ?? false;
    const resolvedTheme = resolveDashboardTheme(theme);
    const root = window.document.documentElement;
    const body = window.document.body;
    const themeVars = resolvedTheme === "dark" ? DARK_THEME_VARS : LIGHT_THEME_VARS;

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.fontSize = FONT_SIZE_MAP[fontSize];

    Object.entries(themeVars).forEach(([name, value]) => {
        root.style.setProperty(name, value);
        body.style.setProperty(name, value);
    });

    body.dataset.dashboardTheme = resolvedTheme;
    body.dataset.dashboardThemePreference = theme;
    body.dataset.dashboardFontSize = fontSize;
    body.style.backgroundColor = themeVars["--dashboard-shell-bg"];
    body.style.color = themeVars["--dashboard-text-primary"];

    if (persist) {
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
        window.localStorage.setItem(DASHBOARD_FONT_SIZE_STORAGE_KEY, fontSize);
    }
}