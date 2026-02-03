"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Save, Play, Settings, Eye, Users, Cloud,
    Palette, Type, Image, Plus, Trash2, Copy, MoreVertical,
    Monitor, Smartphone, ChevronDown, Check, Lock, Unlock,
    QrCode, Share2, Maximize2, RotateCcw, Zap, RefreshCw
} from "lucide-react";

// Kelime Bulutu Motorları
const WORDCLOUD_ENGINES = [
    { id: 'ggwordcloud-style', name: 'Klasik', description: 'Profesyonel, siyah-beyaz' },
    { id: 'wordart-style', name: 'Renkli', description: 'Canlı renkler, animasyonlu' },
    { id: 'd3-cloud', name: 'D3 Cloud', description: 'Esnek, özelleştirilebilir' },
    { id: 'wordcloud2', name: 'WordCloud2', description: 'Hafif, hızlı' },
];

// Renk Paletleri
const COLOR_PALETTES = [
    { id: 'colorful', name: 'Renkli', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'] },
    { id: 'ocean', name: 'Okyanus', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E'] },
    { id: 'sunset', name: 'Gün Batımı', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'] },
    { id: 'monochrome', name: 'Tek Renk', colors: ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9'] },
    { id: 'neon', name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#00FF80'] },
];

// Arka Plan Gradientleri
const BACKGROUND_GRADIENTS = [
    { id: 'purple-blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'pink-orange', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'blue-cyan', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'green-blue', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'orange-red', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'dark', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    { id: 'midnight', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
    { id: 'ocean', gradient: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
];

interface Slide {
    id: number;
    type: string;
    question: string;
    background: string;
    maxResponses: string;
    wordCloudEngine: string;
    wordCloudStyle: {
        fontFamily: string;
        colorMode: string;
        colorPalette: string;
        singleColor: string;
        orientation: string;
        rotateRatio: number;
    };
    textStyle: {
        color: string;
        fontFamily: string;
        fontSize: number;
        bold: boolean;
    };
}

// Örnek kelimeler (preview için) - Resimde görüldüğü gibi farklı boyutlarda
const SAMPLE_WORDS = [
    { text: 'mutluluk', weight: 100 },
    { text: 'sevgi', weight: 90 },
    { text: 'aile', weight: 85 },
    { text: 'huzur', weight: 80 },
    { text: 'başarı', weight: 75 },
    { text: 'dostluk', weight: 70 },
    { text: 'sağlık', weight: 68 },
    { text: 'özgürlük', weight: 65 },
    { text: 'umut', weight: 60 },
    { text: 'güven', weight: 55 },
    { text: 'neşe', weight: 50 },
    { text: 'barış', weight: 48 },
    { text: 'gülümseme', weight: 45 },
    { text: 'hayat', weight: 42 },
    { text: 'tutku', weight: 40 },
    { text: 'gelecek', weight: 38 },
    { text: 'rüya', weight: 35 },
    { text: 'güzellik', weight: 32 },
    { text: 'içtenlik', weight: 30 },
    { text: 'dürüstlük', weight: 28 },
    { text: 'sabır', weight: 26 },
    { text: 'emek', weight: 24 },
    { text: 'paylaşım', weight: 22 },
    { text: 'anlayış', weight: 20 },
    { text: 'saygı', weight: 18 },
    { text: 'merhamet', weight: 16 },
    { text: 'cesaret', weight: 15 },
    { text: 'hoşgörü', weight: 14 },
    { text: 'iyilik', weight: 13 },
    { text: 'şükür', weight: 12 },
    { text: 'enerji', weight: 11 },
    { text: 'ilham', weight: 10 },
    { text: 'yaratıcılık', weight: 9 },
    { text: 'şefkat', weight: 8 },
    { text: 'fedakarlık', weight: 7 },
];

export default function WordCloudEditorPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [presentationCode, setPresentationCode] = useState('');
    const [presentationTitle, setTitle] = useState('Yeni Kelime Bulutu');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'style' | 'wordcloud' | 'background' | 'settings'>('wordcloud');
    
    const [slides, setSlides] = useState<Slide[]>([
        {
            id: 1,
            type: 'word-cloud',
            question: 'Mutluluğu tek kelimeyle nasıl tanımlarsınız?',
            background: BACKGROUND_GRADIENTS[0].gradient,
            maxResponses: 'unlimited',
            wordCloudEngine: 'ggwordcloud-style',
            wordCloudStyle: {
                fontFamily: 'Impact, Arial Black, sans-serif',
                colorMode: 'colorful',
                colorPalette: 'colorful',
                singleColor: '#ffffff',
                orientation: 'mixed',
                rotateRatio: 0.35,
            },
            textStyle: {
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontSize: 32,
                bold: true,
            },
        }
    ]);

    const currentSlide = slides[currentSlideIndex];

    // Sunum kodu oluştur
    useEffect(() => {
        const code = Math.random().toString().slice(2, 10);
        setPresentationCode(code);
    }, []);

    // Slide güncelleme
    const updateSlide = useCallback((updates: Partial<Slide>) => {
        setSlides(prev => prev.map((slide, i) => 
            i === currentSlideIndex ? { ...slide, ...updates } : slide
        ));
    }, [currentSlideIndex]);

    // WordCloud Style güncelleme
    const updateWordCloudStyle = useCallback((updates: Partial<Slide['wordCloudStyle']>) => {
        setSlides(prev => prev.map((slide, i) => 
            i === currentSlideIndex 
                ? { ...slide, wordCloudStyle: { ...slide.wordCloudStyle, ...updates } } 
                : slide
        ));
    }, [currentSlideIndex]);

    // Text Style güncelleme
    const updateTextStyle = useCallback((updates: Partial<Slide['textStyle']>) => {
        setSlides(prev => prev.map((slide, i) => 
            i === currentSlideIndex 
                ? { ...slide, textStyle: { ...slide.textStyle, ...updates } } 
                : slide
        ));
    }, [currentSlideIndex]);

    // Yeni slayt ekle
    const addSlide = () => {
        const newSlide: Slide = {
            id: Date.now(),
            type: 'word-cloud',
            question: 'Yeni soru...',
            background: BACKGROUND_GRADIENTS[Math.floor(Math.random() * BACKGROUND_GRADIENTS.length)].gradient,
            maxResponses: 'unlimited',
            wordCloudEngine: 'ggwordcloud-style',
            wordCloudStyle: {
                fontFamily: 'Impact, Arial Black, sans-serif',
                colorMode: 'colorful',
                colorPalette: 'colorful',
                singleColor: '#ffffff',
                orientation: 'mixed',
                rotateRatio: 0.35,
            },
            textStyle: {
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontSize: 32,
                bold: true,
            },
        };
        setSlides(prev => [...prev, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    // Slayt sil
    const deleteSlide = (index: number) => {
        if (slides.length === 1) return;
        setSlides(prev => prev.filter((_, i) => i !== index));
        if (currentSlideIndex >= index && currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    // Kaydet
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: API çağrısı
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Saved:', { title: presentationTitle, code: presentationCode, slides });
        } finally {
            setIsSaving(false);
        }
    };

    // Sunumu başlat
    const handleStartPresentation = () => {
        window.open(`/presentation/wordcloud/${presentationCode}`, '_blank');
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Cloud className="text-purple-500" size={24} />
                        <input
                            type="text"
                            value={presentationTitle}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500/20 rounded px-2 py-1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sunum Kodu */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                        <span className="text-sm text-gray-500">Kod:</span>
                        <span className="font-mono font-bold text-gray-800">
                            {presentationCode.slice(0, 4)} {presentationCode.slice(4)}
                        </span>
                        <button 
                            onClick={() => navigator.clipboard.writeText(presentationCode)}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <Copy size={14} className="text-gray-500" />
                        </button>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        <Save size={18} />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>

                    <button 
                        onClick={handleStartPresentation}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
                    >
                        <Play size={18} />
                        Sunumu Başlat
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Slides */}
                <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-3 border-b border-gray-100">
                        <button 
                            onClick={addSlide}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            Yeni Slayt
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                onClick={() => setCurrentSlideIndex(index)}
                                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                    index === currentSlideIndex 
                                        ? 'border-purple-500 shadow-lg' 
                                        : 'border-transparent hover:border-gray-300'
                                }`}
                            >
                                <div 
                                    className="aspect-video p-2"
                                    style={{ background: slide.background }}
                                >
                                    <div className="flex items-center justify-center h-full">
                                        <Cloud className="text-white/50" size={24} />
                                    </div>
                                </div>
                                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                    {index + 1}
                                </div>
                                {slides.length > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center - Canvas */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div 
                        className="flex-1 rounded-2xl shadow-2xl overflow-hidden relative"
                        style={{ background: currentSlide.background }}
                    >
                        {/* Question Header */}
                        <div className="absolute top-0 left-0 right-0 p-8 text-center">
                            <input
                                type="text"
                                value={currentSlide.question}
                                onChange={(e) => updateSlide({ question: e.target.value })}
                                className="w-full max-w-3xl mx-auto text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-white/30 rounded-lg px-4 py-2"
                                style={{
                                    color: currentSlide.textStyle.color,
                                    fontFamily: currentSlide.textStyle.fontFamily,
                                    fontSize: `${currentSlide.textStyle.fontSize}px`,
                                    fontWeight: currentSlide.textStyle.bold ? 'bold' : 'normal',
                                }}
                                placeholder="Sorunuzu buraya yazın..."
                            />
                        </div>

                        {/* Word Cloud Preview */}
                        <div className="absolute inset-0 flex items-center justify-center pt-24 pb-16">
                            <WordCloudPreview 
                                words={SAMPLE_WORDS} 
                                style={currentSlide.wordCloudStyle}
                                engine={currentSlide.wordCloudEngine}
                            />
                        </div>

                        {/* Bottom Bar - Stats */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/30 to-transparent">
                            <div className="flex items-center gap-4 text-white/80 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span>0 katılımcı</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Cloud size={16} />
                                    <span>0 kelime</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <QrCode size={20} className="text-white/80" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Settings */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    {/* Settings Tabs */}
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: 'wordcloud', icon: Cloud, label: 'Kelime Bulutu' },
                            { id: 'style', icon: Type, label: 'Yazı' },
                            { id: 'background', icon: Image, label: 'Arka Plan' },
                            { id: 'settings', icon: Settings, label: 'Ayarlar' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSettingsTab(tab.id as any)}
                                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                                    activeSettingsTab === tab.id
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeSettingsTab === 'wordcloud' && (
                            <WordCloudSettings 
                                slide={currentSlide}
                                updateWordCloudStyle={updateWordCloudStyle}
                                updateSlide={updateSlide}
                            />
                        )}
                        {activeSettingsTab === 'style' && (
                            <TextStyleSettings
                                slide={currentSlide}
                                updateTextStyle={updateTextStyle}
                            />
                        )}
                        {activeSettingsTab === 'background' && (
                            <BackgroundSettings
                                slide={currentSlide}
                                updateSlide={updateSlide}
                            />
                        )}
                        {activeSettingsTab === 'settings' && (
                            <GeneralSettings
                                slide={currentSlide}
                                updateSlide={updateSlide}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Word Cloud Preview Component - Her motor için farklı stil
function WordCloudPreview({ words, style, engine }: { 
    words: { text: string; weight: number }[];
    style: Slide['wordCloudStyle'];
    engine: string;
}) {
    const palette = COLOR_PALETTES.find(p => p.id === style.colorPalette)?.colors || COLOR_PALETTES[0].colors;
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
    const [animationKey, setAnimationKey] = useState(0);

    // Container boyutlarını al
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width: Math.max(width, 400), height: Math.max(height - 20, 300) });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Engine değiştiğinde animasyonu tetikle
    useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [engine]);

    // Motor bazlı stiller
    const engineConfig = useMemo(() => {
        switch (engine) {
            case 'ggwordcloud-style': // Klasik - Profesyonel, siyah-beyaz tonları
                return {
                    fontFamily: 'Georgia, serif',
                    colors: style.colorMode === 'single' ? [style.singleColor] : ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
                    fontWeight: 'bold' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'fade',
                };
            case 'wordart-style': // Renkli - Canlı renkler, animasyonlu
                return {
                    fontFamily: 'Comic Sans MS, cursive',
                    colors: style.colorMode === 'single' ? [style.singleColor] : palette,
                    fontWeight: 'bold' as const,
                    textShadow: true,
                    glow: true,
                    animation: 'bounce',
                };
            case 'd3-cloud': // D3 Cloud - Esnek, özelleştirilebilir
                return {
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    colors: style.colorMode === 'single' ? [style.singleColor] : ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
                    fontWeight: '600' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'scale',
                };
            case 'wordcloud2': // WordCloud2 - Hafif, hızlı
                return {
                    fontFamily: 'Arial Black, sans-serif',
                    colors: style.colorMode === 'single' ? [style.singleColor] : ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8', '#e17055'],
                    fontWeight: 'bold' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'slide',
                };
            default:
                return {
                    fontFamily: 'Impact, sans-serif',
                    colors: palette,
                    fontWeight: 'bold' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'fade',
                };
        }
    }, [engine, style.colorMode, style.singleColor, palette]);

    // Yerleştirilmiş kelimeler
    const placedWords = useMemo(() => {
        const width = dimensions.width;
        const height = dimensions.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Kelimeleri ağırlığa göre sırala
        const sortedWords = [...words].sort((a, b) => b.weight - a.weight);
        
        // Yerleştirilmiş kelimeler ve bounding box'ları
        const placed: Array<{
            text: string;
            x: number;
            y: number;
            fontSize: number;
            rotation: number;
            color: string;
            delay: number;
            bbox: { x: number; y: number; width: number; height: number };
        }> = [];
        
        // Çakışma kontrolü
        const checkCollision = (bbox: { x: number; y: number; width: number; height: number }) => {
            const padding = 6;
            for (const word of placed) {
                const a = word.bbox;
                const b = bbox;
                if (!(a.x + a.width + padding < b.x || 
                      b.x + b.width + padding < a.x || 
                      a.y + a.height + padding < b.y || 
                      b.y + b.height + padding < a.y)) {
                    return true;
                }
            }
            return false;
        };
        
        // Random seed için sabit değer kullan (motor değişince değişsin)
        const seed = engine.charCodeAt(0) + engine.length;
        const seededRandom = (i: number) => {
            const x = Math.sin(seed + i * 9999) * 10000;
            return x - Math.floor(x);
        };
        
        // Her kelimeyi yerleştir
        sortedWords.forEach((word, index) => {
            // Font boyutu hesapla (min: 12, max: 64)
            const maxWeight = sortedWords[0]?.weight || 100;
            const minFontSize = 12;
            const maxFontSize = 60;
            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, (word.weight / maxWeight) * maxFontSize));
            
            // Rotasyon
            let rotation = 0;
            if (style.orientation === 'vertical') {
                rotation = 90;
            } else if (style.orientation === 'mixed') {
                if (seededRandom(index) < style.rotateRatio) {
                    rotation = seededRandom(index * 2) > 0.5 ? 90 : -90;
                }
            }
            
            // Renk
            const colors = engineConfig.colors;
            const color = colors[index % colors.length];
            
            // Kelime boyutlarını hesapla
            const charWidth = fontSize * 0.52;
            const wordWidth = rotation === 0 ? word.text.length * charWidth : fontSize * 1.1;
            const wordHeight = rotation === 0 ? fontSize * 1.1 : word.text.length * charWidth;
            
            // Spiral algoritması ile pozisyon bul
            let foundPosition = false;
            let angle = seededRandom(index * 3) * Math.PI * 2;
            let radius = 0;
            const spiralStep = 0.25;
            const maxAttempts = 1000;
            let attempts = 0;
            
            while (!foundPosition && attempts < maxAttempts) {
                // Spiral pozisyon hesapla - eliptik
                const x = centerX + radius * Math.cos(angle) * 1.3 - wordWidth / 2;
                const y = centerY + radius * Math.sin(angle) * 0.8 - wordHeight / 2;
                
                const bbox = {
                    x: x,
                    y: y,
                    width: wordWidth,
                    height: wordHeight
                };
                
                // Sınırlar içinde mi ve çakışma var mı kontrol et
                if (x >= 10 && x + wordWidth <= width - 10 &&
                    y >= 10 && y + wordHeight <= height - 10 &&
                    !checkCollision(bbox)) {
                    
                    placed.push({
                        text: word.text,
                        x: x + wordWidth / 2,
                        y: y + wordHeight / 2 + fontSize / 3,
                        fontSize,
                        rotation,
                        color,
                        delay: index * 0.03,
                        bbox
                    });
                    foundPosition = true;
                }
                
                angle += spiralStep;
                radius += 0.4 + (fontSize * 0.015);
                attempts++;
            }
        });
        
        return placed;
    }, [words, style, dimensions, engineConfig]);

    // CSS animasyonları
    const getAnimationStyle = (delay: number): React.CSSProperties => {
        switch (engineConfig.animation) {
            case 'bounce':
                return {
                    animation: `wordBounce 0.5s ease-out ${delay}s both`,
                };
            case 'scale':
                return {
                    animation: `wordScale 0.4s ease-out ${delay}s both`,
                };
            case 'slide':
                return {
                    animation: `wordSlide 0.3s ease-out ${delay}s both`,
                };
            default:
                return {
                    animation: `wordFade 0.3s ease-out ${delay}s both`,
                };
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <style jsx>{`
                @keyframes wordFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes wordBounce {
                    0% { opacity: 0; transform: scale(0.3) translateY(-20px); }
                    60% { transform: scale(1.1) translateY(0); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes wordScale {
                    from { opacity: 0; transform: scale(0); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes wordSlide {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .word-glow {
                    filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 15px currentColor);
                }
                .word-shadow {
                    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
                }
            `}</style>
            <svg 
                key={animationKey}
                width={dimensions.width} 
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="overflow-visible"
            >
                {/* Gradient tanımları (motor: d3-cloud için) */}
                {engine === 'd3-cloud' && style.colorMode === 'gradient' && (
                    <defs>
                        <linearGradient id="wordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                    </defs>
                )}
                {placedWords.map((word, i) => (
                    <text
                        key={`${word.text}-${i}-${animationKey}`}
                        x={word.x}
                        y={word.y}
                        fontSize={word.fontSize}
                        fontFamily={engineConfig.fontFamily}
                        fontWeight={engineConfig.fontWeight}
                        fill={style.colorMode === 'gradient' && engine === 'd3-cloud' ? 'url(#wordGradient)' : word.color}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={word.rotation !== 0 ? `rotate(${word.rotation}, ${word.x}, ${word.y})` : undefined}
                        className={`${engineConfig.glow ? 'word-glow' : ''} ${engineConfig.textShadow ? 'word-shadow' : ''}`}
                        style={{ 
                            ...getAnimationStyle(word.delay),
                            cursor: 'pointer',
                        }}
                    >
                        {word.text}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// WordCloud Settings Panel
function WordCloudSettings({ slide, updateWordCloudStyle, updateSlide }: {
    slide: Slide;
    updateWordCloudStyle: (updates: Partial<Slide['wordCloudStyle']>) => void;
    updateSlide: (updates: Partial<Slide>) => void;
}) {
    return (
        <div className="space-y-6">
            {/* Motor Seçimi */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görselleştirme Motoru</label>
                <div className="space-y-2">
                    {WORDCLOUD_ENGINES.map((engine) => (
                        <button
                            key={engine.id}
                            onClick={() => updateSlide({ wordCloudEngine: engine.id })}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                slide.wordCloudEngine === engine.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                slide.wordCloudEngine === engine.id ? 'bg-purple-500' : 'bg-gray-200'
                            }`}>
                                <Cloud size={16} className={slide.wordCloudEngine === engine.id ? 'text-white' : 'text-gray-500'} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{engine.name}</div>
                                <div className="text-xs text-gray-500">{engine.description}</div>
                            </div>
                            {slide.wordCloudEngine === engine.id && (
                                <Check size={18} className="ml-auto text-purple-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Renk Modu */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Renk Modu</label>
                <div className="grid grid-cols-3 gap-2">
                    {['colorful', 'single', 'gradient'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => updateWordCloudStyle({ colorMode: mode })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                slide.wordCloudStyle.colorMode === mode
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {mode === 'colorful' ? 'Renkli' : mode === 'single' ? 'Tek Renk' : 'Gradient'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Renk Paleti */}
            {slide.wordCloudStyle.colorMode === 'colorful' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Renk Paleti</label>
                    <div className="space-y-2">
                        {COLOR_PALETTES.map((palette) => (
                            <button
                                key={palette.id}
                                onClick={() => updateWordCloudStyle({ colorPalette: palette.id })}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                    slide.wordCloudStyle.colorPalette === palette.id
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex gap-1">
                                    {palette.colors.slice(0, 5).map((color, i) => (
                                        <div 
                                            key={i} 
                                            className="w-5 h-5 rounded-full" 
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{palette.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tek Renk Seçici */}
            {slide.wordCloudStyle.colorMode === 'single' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelime Rengi</label>
                    <input
                        type="color"
                        value={slide.wordCloudStyle.singleColor}
                        onChange={(e) => updateWordCloudStyle({ singleColor: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer"
                    />
                </div>
            )}

            {/* Yönelim */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelime Yönelimi</label>
                <div className="grid grid-cols-3 gap-2">
                    {['horizontal', 'mixed', 'vertical'].map((orientation) => (
                        <button
                            key={orientation}
                            onClick={() => updateWordCloudStyle({ orientation })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                slide.wordCloudStyle.orientation === orientation
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {orientation === 'horizontal' ? 'Yatay' : orientation === 'mixed' ? 'Karışık' : 'Dikey'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Döndürme Oranı */}
            {slide.wordCloudStyle.orientation === 'mixed' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Döndürme Oranı: {Math.round(slide.wordCloudStyle.rotateRatio * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={slide.wordCloudStyle.rotateRatio}
                        onChange={(e) => updateWordCloudStyle({ rotateRatio: parseFloat(e.target.value) })}
                        className="w-full accent-purple-500"
                    />
                </div>
            )}

            {/* Font */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelime Fontu</label>
                <select
                    value={slide.wordCloudStyle.fontFamily}
                    onChange={(e) => updateWordCloudStyle({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="Impact, Arial Black, sans-serif">Impact</option>
                    <option value="Arial Black, sans-serif">Arial Black</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                </select>
            </div>
        </div>
    );
}

// Text Style Settings Panel
function TextStyleSettings({ slide, updateTextStyle }: {
    slide: Slide;
    updateTextStyle: (updates: Partial<Slide['textStyle']>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soru Rengi</label>
                <input
                    type="color"
                    value={slide.textStyle.color}
                    onChange={(e) => updateTextStyle({ color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font</label>
                <select
                    value={slide.textStyle.fontFamily}
                    onChange={(e) => updateTextStyle({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Boyutu: {slide.textStyle.fontSize}px
                </label>
                <input
                    type="range"
                    min="16"
                    max="64"
                    value={slide.textStyle.fontSize}
                    onChange={(e) => updateTextStyle({ fontSize: parseInt(e.target.value) })}
                    className="w-full accent-purple-500"
                />
            </div>

            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={slide.textStyle.bold}
                        onChange={(e) => updateTextStyle({ bold: e.target.checked })}
                        className="w-4 h-4 text-purple-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Kalın</span>
                </label>
            </div>
        </div>
    );
}

// Background Settings Panel
function BackgroundSettings({ slide, updateSlide }: {
    slide: Slide;
    updateSlide: (updates: Partial<Slide>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Hazır Gradientler</label>
                <div className="grid grid-cols-2 gap-3">
                    {BACKGROUND_GRADIENTS.map((bg) => (
                        <button
                            key={bg.id}
                            onClick={() => updateSlide({ background: bg.gradient })}
                            className={`aspect-video rounded-lg transition-all ${
                                slide.background === bg.gradient
                                    ? 'ring-2 ring-purple-500 ring-offset-2'
                                    : 'hover:scale-105'
                            }`}
                            style={{ background: bg.gradient }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Özel Renk</label>
                <input
                    type="color"
                    onChange={(e) => updateSlide({ background: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                />
            </div>
        </div>
    );
}

// General Settings Panel
function GeneralSettings({ slide, updateSlide }: {
    slide: Slide;
    updateSlide: (updates: Partial<Slide>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Cevap Sayısı</label>
                <select
                    value={slide.maxResponses}
                    onChange={(e) => updateSlide({ maxResponses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="1">1 cevap</option>
                    <option value="2">2 cevap</option>
                    <option value="3">3 cevap</option>
                    <option value="5">5 cevap</option>
                    <option value="unlimited">Sınırsız</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Her katılımcının gönderebileceği maksimum kelime sayısı</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Görünüm Ayarları</h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 rounded" />
                        <span className="text-sm text-gray-700">QR Kod Göster</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 rounded" />
                        <span className="text-sm text-gray-700">Katılımcı Sayısını Göster</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-500 rounded" />
                        <span className="text-sm text-gray-700">Canlı Güncelleme</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
