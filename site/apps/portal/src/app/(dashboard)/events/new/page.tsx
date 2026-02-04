"use client";

import { useState } from "react";
import {
    FileType, FileText,
    Ticket, Star, Timer, Trophy, Radio,
    Search, Bell, ChevronDown, Filter
} from "lucide-react";
import { EventTypeCard } from "../../../../components/events/EventTypeCard";
import SettingsModal from "../../../../components/Event/CreateEventModal";
import { useRouter } from "next/navigation";
import { COMING_SOON_CARD, ENABLED_NEW_EVENT_CARD_DEFS, type SupportedEventType } from "@/lib/eventTypes";

const EVENT_TYPES = [
    // Keep the placeholder "coming soon" card only when multiple types are enabled.
    ...(ENABLED_NEW_EVENT_CARD_DEFS.length > 1 ? [COMING_SOON_CARD] : []),
    ...ENABLED_NEW_EVENT_CARD_DEFS,
    // Extra placeholders (only meaningful in the full portal)
    ...(ENABLED_NEW_EVENT_CARD_DEFS.length > 1
        ? [
            { title: "Kelime Oyunu", gradient: "from-gray-600 to-gray-800", icon: FileType, isComingSoon: true },
            { title: "Açık Uçlu", gradient: "from-gray-600 to-gray-800", icon: FileText, isComingSoon: true },
            { title: "Puanlama", gradient: "from-gray-600 to-gray-800", icon: Star, isComingSoon: true },
            { title: "Çekiliş", gradient: "from-gray-600 to-gray-800", icon: Ticket, isComingSoon: true },
            { title: "Zamanlayıcı", gradient: "from-gray-600 to-gray-800", icon: Timer, isComingSoon: true },
            { title: "Yarışma", gradient: "from-gray-600 to-gray-800", icon: Trophy, isComingSoon: true },
            { title: "Canlı Anket", gradient: "from-gray-600 to-gray-800", icon: Radio, isComingSoon: true },
        ]
        : []),
];

export default function NewEventPage() {
    const [showSettings, setShowSettings] = useState(true);
    const [selectedType, setSelectedType] = useState<SupportedEventType>('quiz');
    const [settingsInitialStep, setSettingsInitialStep] = useState<'template' | 'settings' | 'details'>('settings');
    const [selectedTitle, setSelectedTitle] = useState('CANLI SORU');
    const router = useRouter();

    const getCardEventType = (card: (typeof EVENT_TYPES)[number]): SupportedEventType | undefined => {
        const maybeType = (card as { type?: unknown }).type;
        return typeof maybeType === 'string' ? (maybeType as SupportedEventType) : undefined;
    };

    const handleCardClick = (type: SupportedEventType, title: string) => {
        setSelectedTitle(title);
        setSettingsInitialStep('settings');
        const def = ENABLED_NEW_EVENT_CARD_DEFS.find((d) => d.type === type);
        if (def?.open === 'route' && def.route) {
            router.push(def.route);
            return;
        }

        setSelectedType(type);
        setShowSettings(true);
    };

    return (
        <div className="min-h-screen bg-[#F8F8F8]">
            {showSettings && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    initialStep={settingsInitialStep}
                    initialTemplate={selectedType}
                    displayTitle={selectedTitle}
                    onEventCreated={(event) => {
                        console.log("Event created via card click", event);
                    }}
                />
            )}
            {/* Top Bar */}
            <header className="h-[72px] bg-white border-b border-gray-200 sticky top-0 z-30 px-8 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium">Ana Sayfa &gt; Etkinlik Türleri</span>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Etkinlik Türü Seçin</h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Search */}
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Etkinlik ara..."
                            className="bg-gray-100 hover:bg-gray-50 focus:bg-white text-sm rounded-lg pl-10 pr-4 py-2 w-64 border border-transparent focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-sm font-medium text-gray-700">
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filtrele: Tümü</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>

                    <div className="w-px h-8 bg-gray-200 mx-2" />

                    {/* Notifications */}
                    <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>

                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black p-0.5 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold">
                            MK
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8 md:p-12 overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 max-w-[1600px] mx-auto">
                    {EVENT_TYPES.map((type, idx) => (
                        <EventTypeCard
                            key={idx}
                            {...type}
                            onClick={() => {
                                const maybeDef = getCardEventType(type);
                                if (maybeDef) {
                                    handleCardClick(maybeDef, type.title);
                                }
                            }}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}
