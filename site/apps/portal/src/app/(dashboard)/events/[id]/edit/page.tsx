"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    Type,
    MessageSquare,
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
    
    // Hostname state - initialized empty for SSR compatibility
    const [hostName, setHostName] = useState('');

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
                // Ensure QR position matches logic if needed
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
                if (field) {
                    setter(reader.result as string); // For slide image
                } else {
                    // For logo objects
                    setter((prev: any) => ({ ...prev, url: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

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

                                <div className="w-full aspect-video bg-white rounded flex items-center justify-center text-xs text-[#7f8c97] overflow-hidden relative">
                                    <div className="flex flex-col items-center justify-center h-full w-full p-3">
                                        <div className="font-semibold text-sm mb-2 text-center truncate w-full">{slide.question}</div>
                                        <div className="text-[10px] opacity-60">Gönderin</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-[11px] text-[#7f8c97] text-center">Soru Gönder</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER - EDITOR AREA */}
                <div className="bg-[#f5f7fa] p-8 flex items-center justify-center overflow-auto">
                    <div
                        className="w-full max-w-[960px] aspect-video rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col items-center justify-center p-[60px] text-center transition-all duration-400"
                        style={{ background: currentSlide.background }}
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

                            <textarea
                                className="w-full bg-transparent border-none text-center resize-none focus:outline-none placeholder-black/30 overflow-hidden"
                                style={{
                                    fontFamily: currentSlide.style.fontFamily,
                                    fontSize: `${currentSlide.style.fontSize}px`,
                                    color: currentSlide.style.color,
                                    fontWeight: currentSlide.style.bold ? 'bold' : 'normal',
                                    fontStyle: currentSlide.style.italic ? 'italic' : 'normal',
                                    textDecoration: currentSlide.style.underline ? 'underline' : 'none',
                                    textShadow: currentSlide.style.shadow ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
                                    transform: `translate(${currentSlide.style.headingX}px, ${currentSlide.style.headingY}px)`
                                }}
                                value={currentSlide.question}
                                onChange={(e) => updateSlide('question', e.target.value)}
                                placeholder="Başlık metnini buraya yazın..."
                                rows={2}
                            />

                            <div className="w-full max-w-[800px] mt-8 p-5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-center">
                                <div className="text-white/50 text-xl italic font-light">
                                    Gelen sorular burada görünecek
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - SETTINGS */}
                <div className="bg-white border-l border-[#e8ecf1] flex flex-col overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6">
                        <TabsList className="flex gap-2 mb-6 border-b border-[#e8ecf1] pb-2 bg-transparent w-full justify-start h-auto">
                            <TabsTrigger value="edit" className="flex-1 flex flex-col gap-1 py-2 text-[13px] font-semibold text-[#5e6c84] data-[state=active]:text-red-600 data-[state=active]:bg-red-50 rounded-md transition-all h-auto">
                                <Type className="h-[18px] w-[18px]" />
                                <span>Edit</span>
                            </TabsTrigger>
                            <TabsTrigger value="comments" className="flex-1 flex flex-col gap-1 py-2 text-[13px] font-semibold text-[#5e6c84] data-[state=active]:text-red-600 data-[state=active]:bg-red-50 rounded-md transition-all h-auto">
                                <MessageSquare className="h-[18px] w-[18px]" />
                                <span>Comments</span>
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
                                        onChange={(e) => updateSlide('style.fontFamily', e.target.value)}
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
                                                    className={`aspect-square rounded-md border-2 cursor-pointer hover:scale-110 transition-transform ${currentSlide.style.color === color ? 'border-red-500 ring-2 ring-red-500/20' : 'border-transparent'}`}
                                                    style={{ background: color }}
                                                    onClick={() => {
                                                        updateSlide('style.color', color);
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
                                        { label: 'Talimat çubuğunu göster', val: showInstructions, set: setShowInstructions },
                                        { label: 'QR kodu göster', val: showQR, set: setShowQR },
                                        { label: 'Katılımcı bilgisi göster', val: showStats, set: setShowStats },
                                        { label: 'Katılımcı isimlerini göster', val: showNames, set: setShowNames },
                                        { label: 'Arka plan animasyonu', val: bgAnimation, set: setBgAnimation },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-sm text-[#2c3e50]">{item.label}</span>
                                            <Switch checked={item.val} onCheckedChange={item.set} />
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
                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo)} />
                                    {logo.url && (
                                        <button className="px-3 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100" onClick={() => setLogo(prev => ({ ...prev, url: null }))}>
                                            🗑️
                                        </button>
                                    )}
                                </div>
                                {logo.url && (
                                    <div className="space-y-3 pl-2 border-l-2 border-[#e2e8f0]">
                                        <div>
                                            <div className="flex justify-between text-xs text-red-600 font-semibold mb-1"><span className="text-[#7f8c97]">Boyut</span> {logo.size}px</div>
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
                                        <input type="file" ref={rightLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setRightLogo)} />
                                        {rightLogo.url && (
                                            <button className="px-3 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100" onClick={() => setRightLogo(prev => ({ ...prev, url: null }))}>
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                    {rightLogo.url && (
                                        <div className="space-y-3 pl-2 border-l-2 border-[#e2e8f0]">
                                            <div>
                                                <div className="flex justify-between text-xs text-[#667eea] font-semibold mb-1"><span className="text-[#7f8c97]">Boyut</span> {rightLogo.size}px</div>
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

                        <TabsContent value="comments" className="m-0 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center py-10 text-gray-400 italic">
                                Henüz yorum yok
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
