import type { LucideIcon } from "lucide-react";
import { Gamepad2, HelpCircle, BarChart, Ticket, Aperture, Cloud, ListOrdered, Puzzle } from "lucide-react";

export type SupportedEventType =
    | "quiz"
    | "poll"
    | "tombala"
    | "wheel"
    | "ranking"
    | "wordcloud"
    | "matching";

export const SUPPORTED_EVENT_TYPES: SupportedEventType[] = [
    "quiz",
    "poll",
    "tombala",
    "wheel",
    "ranking",
    "wordcloud",
    "matching",
];

export const EVENT_TYPE_LABELS: Record<SupportedEventType, string> = {
    quiz: "Canlı Soru",
    poll: "Anket",
    tombala: "Tombala",
    wheel: "Hediye Çarkı",
    ranking: "Sıralama",
    wordcloud: "Kelime Bulutu",
    matching: "Eşleştirme",
};

export function getEventTypeLabel(rawType: unknown): string {
    const type = typeof rawType === "string" ? rawType : undefined;
    if (!type) return "Etkinlik";

    const normalized = type.toLowerCase();
    if (normalized === "wheel") return EVENT_TYPE_LABELS.wheel;

    if (isSupportedEventType(type)) return EVENT_TYPE_LABELS[type];
    if (isSupportedEventType(normalized)) return EVENT_TYPE_LABELS[normalized];

    return "Etkinlik";
}

export function isSupportedEventType(type: string): type is SupportedEventType {
    return (Object.keys(EVENT_TYPE_LABELS) as SupportedEventType[]).includes(type as SupportedEventType);
}

export type EventTypeCardDef = {
    type: SupportedEventType;
    title: string;
    gradient: string;
    icon: LucideIcon;
    open: "settings" | "route";
    route?: string;
};

export const NEW_EVENT_CARD_DEFS: EventTypeCardDef[] = [
    {
        type: "quiz",
        title: EVENT_TYPE_LABELS.quiz,
        gradient: "from-black via-red-900 to-red-700",
        icon: HelpCircle,
        open: "settings",
    },
    {
        type: "poll",
        title: EVENT_TYPE_LABELS.poll,
        gradient: "from-gray-600 to-gray-800",
        icon: BarChart,
        open: "settings",
    },
    {
        type: "tombala",
        title: EVENT_TYPE_LABELS.tombala,
        gradient: "from-gray-600 to-gray-800",
        icon: Ticket,
        open: "settings",
    },
    {
        type: "wordcloud",
        title: EVENT_TYPE_LABELS.wordcloud,
        gradient: "from-purple-600 via-blue-600 to-cyan-500",
        icon: Cloud,
        open: "route",
        route: "/events/new/wordcloud",
    },
    {
        type: "ranking",
        title: EVENT_TYPE_LABELS.ranking,
        gradient: "from-emerald-600 via-teal-600 to-cyan-500",
        icon: ListOrdered,
        open: "settings",
    },
    {
        type: "matching",
        title: EVENT_TYPE_LABELS.matching,
        gradient: "from-indigo-600 via-purple-600 to-fuchsia-500",
        icon: Puzzle,
        open: "settings",
    },
    {
        type: "wheel",
        title: EVENT_TYPE_LABELS.wheel,
        gradient: "from-amber-500 via-orange-500 to-red-600",
        icon: Aperture,
        open: "settings",
    },
];

export type TemplateSelectionDef = {
    template: SupportedEventType;
    title: string;
    description: string;
    emoji: string;
};

export const TEMPLATE_SELECTION_DEFS: TemplateSelectionDef[] = [
    {
        template: "quiz",
        title: EVENT_TYPE_LABELS.quiz,
        description: "Interaktif soru-cevap oturumu",
        emoji: "📊",
    },
    {
        template: "poll",
        title: EVENT_TYPE_LABELS.poll,
        description: "Katılımcı görüşlerini toplayın",
        emoji: "📋",
    },
    {
        template: "tombala",
        title: EVENT_TYPE_LABELS.tombala,
        description: "Eğlenceli çekiliş oyunu",
        emoji: "🎲",
    },
    {
        template: "wheel",
        title: EVENT_TYPE_LABELS.wheel,
        description: "Şans çarkı ile hediye dağıtın",
        emoji: "🎡",
    },
    {
        template: "ranking",
        title: EVENT_TYPE_LABELS.ranking,
        description: "Katılımcıları sıralayın ve puanlayın",
        emoji: "🏆",
    },
    {
        template: "matching",
        title: EVENT_TYPE_LABELS.matching,
        description: "Hafızaları test eden eşleştirme oyunu",
        emoji: "🧩",
    },
    {
        template: "wordcloud",
        title: EVENT_TYPE_LABELS.wordcloud,
        description: "Kelime bulutu etkinliği oluşturun",
        emoji: "☁️",
    },
];

function parseEnabledEventTypes(raw: string | undefined): SupportedEventType[] {
    // Default to quiz only for soruyorum.online
    if (!raw || !raw.trim()) return ["quiz"];
    const parts = raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

    const unique = new Set<SupportedEventType>();
    for (const part of parts) {
        if (isSupportedEventType(part)) unique.add(part);
    }

    // If env was set but invalid/empty, fall back to quiz only (safe default)
    if (unique.size === 0) return ["quiz"];
    return Array.from(unique);
}

/**
 * Controls which event types are visible/usable in the Portal UI.
 *
 * - Default (unset): all supported event types
 * - Example: NEXT_PUBLIC_ENABLED_EVENT_TYPES=quiz
 */
export const ENABLED_EVENT_TYPES: SupportedEventType[] = parseEnabledEventTypes(
    process.env.NEXT_PUBLIC_ENABLED_EVENT_TYPES
);

export const ENABLED_NEW_EVENT_CARD_DEFS: EventTypeCardDef[] = NEW_EVENT_CARD_DEFS.filter((d) =>
    ENABLED_EVENT_TYPES.includes(d.type)
);

export const ENABLED_TEMPLATE_SELECTION_DEFS: TemplateSelectionDef[] = TEMPLATE_SELECTION_DEFS.filter((d) =>
    ENABLED_EVENT_TYPES.includes(d.template)
);

// Convenience for pages that still show a disabled placeholder card
export const COMING_SOON_CARD = {
    title: "Quiz",
    gradient: "from-gray-600 to-gray-800",
    icon: Gamepad2,
    isComingSoon: true,
} as const;
