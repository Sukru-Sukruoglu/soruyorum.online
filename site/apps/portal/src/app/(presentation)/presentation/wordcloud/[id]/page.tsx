"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Cloud, QrCode, Users } from 'lucide-react';

// ==========================================
// CONSTANTS (Mirrored from Admin)
// ==========================================

const COLOR_PALETTES = [
    { id: 'colorful', name: 'Renkli', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'] },
    { id: 'ocean', name: 'Okyanus', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E'] },
    { id: 'sunset', name: 'Gün Batımı', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'] },
    { id: 'monochrome', name: 'Tek Renk', colors: ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9'] },
    { id: 'neon', name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#00FF80'] },
];

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

// Default Sample Words
const DEFAULT_WORDS = [
    { text: 'KS İnteraktif', weight: 100 },
    { text: 'Kelime Bulutu', weight: 80 },
    { text: 'Sunum', weight: 70 },
    { text: 'Etkileşim', weight: 60 },
    { text: 'Katılım', weight: 50 },
    { text: 'Teknoloji', weight: 40 },
    { text: 'Eğlence', weight: 30 },
];

// ==========================================
// COMPONENTS
// ==========================================

function WordCloudPreview({ words, style, engine }: {
    words: { text: string; weight: number }[];
    style: any;
    engine: string;
}) {
    // Default config if style is missing
    const safeStyle = style || {
        colorMode: 'colorful',
        colorPalette: 'colorful',
        singleColor: '#ffffff',
        orientation: 'mixed',
        rotateRatio: 0.35,
    };

    const palette = COLOR_PALETTES.find(p => p.id === safeStyle.colorPalette)?.colors || COLOR_PALETTES[0].colors;
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
    const [animationKey, setAnimationKey] = useState(0);

    // Dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setDimensions({ width: Math.max(width, 400), height: Math.max(height - 20, 300) });
            }
        };
        updateDimensions();
        // Add minimal delay to ensure container renders
        setTimeout(updateDimensions, 100);
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Trigger animation on prop changes
    useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [engine, words]);

    // Engine Config
    const engineConfig = useMemo(() => {
        switch (engine) {
            case 'ggwordcloud-style':
                return {
                    fontFamily: 'Georgia, serif',
                    colors: safeStyle.colorMode === 'single' ? [safeStyle.singleColor] : ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
                    fontWeight: 'bold' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'fade',
                };
            case 'wordart-style':
                return {
                    fontFamily: 'Comic Sans MS, cursive',
                    colors: safeStyle.colorMode === 'single' ? [safeStyle.singleColor] : palette,
                    fontWeight: 'bold' as const,
                    textShadow: true,
                    glow: true,
                    animation: 'bounce',
                };
            case 'd3-cloud':
                return {
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    colors: safeStyle.colorMode === 'single' ? [safeStyle.singleColor] : ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
                    fontWeight: '600' as const,
                    textShadow: false,
                    glow: false,
                    animation: 'scale',
                };
            case 'wordcloud2':
                return {
                    fontFamily: 'Arial Black, sans-serif',
                    colors: safeStyle.colorMode === 'single' ? [safeStyle.singleColor] : ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8', '#e17055'],
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
    }, [engine, safeStyle.colorMode, safeStyle.singleColor, palette]);

    // Placement Logic
    const placedWords = useMemo(() => {
        const width = dimensions.width;
        const height = dimensions.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const sortedWords = [...words].sort((a, b) => b.weight - a.weight);

        const placed: any[] = [];

        const checkCollision = (bbox: any) => {
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

        const seed = (engine || '').charCodeAt(0) + (engine || '').length;
        const seededRandom = (i: number) => {
            const x = Math.sin(seed + i * 9999) * 10000;
            return x - Math.floor(x);
        };

        sortedWords.forEach((word, index) => {
            const maxWeight = sortedWords[0]?.weight || 100;
            const minFontSize = 20;
            const maxFontSize = 100; // Increased for presentation
            const fontSize = Math.max(minFontSize, Math.min(maxFontSize, (word.weight / maxWeight) * maxFontSize));

            let rotation = 0;
            if (safeStyle.orientation === 'vertical') {
                rotation = 90;
            } else if (safeStyle.orientation === 'mixed') {
                if (seededRandom(index) < safeStyle.rotateRatio) {
                    rotation = seededRandom(index * 2) > 0.5 ? 90 : -90;
                }
            }

            const colors = engineConfig.colors;
            const color = colors[index % colors.length];

            const charWidth = fontSize * 0.6;
            const wordWidth = rotation === 0 ? word.text.length * charWidth : fontSize * 1.1;
            const wordHeight = rotation === 0 ? fontSize * 1.1 : word.text.length * charWidth;

            let foundPosition = false;
            let angle = seededRandom(index * 3) * Math.PI * 2;
            let radius = 0;
            const spiralStep = 0.25;
            const maxAttempts = 1500;
            let attempts = 0;

            while (!foundPosition && attempts < maxAttempts) {
                const x = centerX + radius * Math.cos(angle) * 1.3 - wordWidth / 2;
                const y = centerY + radius * Math.sin(angle) * 0.8 - wordHeight / 2;

                const bbox = { x, y, width: wordWidth, height: wordHeight };

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
                        delay: index * 0.05,
                        bbox
                    });
                    foundPosition = true;
                }

                angle += spiralStep;
                radius += 0.4 + (fontSize * 0.01);
                attempts++;
            }
        });

        return placed;
    }, [words, safeStyle, dimensions, engineConfig]);

    const getAnimationStyle = (delay: number) => {
        // Simplified animation mapping
        return { animation: `wordFade 0.5s ease-out ${delay}s both` };
    };

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <style jsx>{`
                @keyframes wordFade { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
                .word-glow { filter: drop-shadow(0 0 10px currentColor); }
            `}</style>
            <svg
                key={animationKey}
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="overflow-visible"
            >
                {placedWords.map((word, i) => (
                    <text
                        key={`${word.text}-${i}-${animationKey}`}
                        x={word.x}
                        y={word.y}
                        fontSize={word.fontSize}
                        fontFamily={engineConfig.fontFamily}
                        fontWeight={engineConfig.fontWeight}
                        fill={word.color}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={word.rotation !== 0 ? `rotate(${word.rotation}, ${word.x}, ${word.y})` : undefined}
                        className={engineConfig.glow ? 'word-glow' : ''}
                        style={{
                            ...getAnimationStyle(word.delay),
                        }}
                    >
                        {word.text}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// ==========================================
// PAGE COMPONENT
// ==========================================

export default function WordCloudPresentationPage({ params }: { params: { id: string } }) {
    // In a real app, fetch data via API or Socket using params.id
    // For now, we use default/demo state or localStorage if available

    // Mock State
    const [title, setTitle] = useState("Kelime Bulutu");
    const [words, setWords] = useState(DEFAULT_WORDS);
    const [participantCount, setParticipantCount] = useState(0);
    const [background, setBackground] = useState(BACKGROUND_GRADIENTS[0].gradient);

    // Attempt to read from LocalStorage (simple comms channel used in other apps)
    useEffect(() => {
        const checkUpdates = () => {
            const stored = localStorage.getItem('wc_live_data'); // Hypothetical key
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.words) setWords(data.words);
                    if (data.title) setTitle(data.title);
                } catch (e) { }
            }
        };
        const interval = setInterval(checkUpdates, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col relative" style={{ background }}>
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10">
                <h1 className="text-5xl font-black text-white drop-shadow-lg text-center">{title}</h1>
            </header>

            {/* Main Canvas */}
            <main className="flex-1 w-full h-full pt-20 pb-20">
                <WordCloudPreview
                    words={words}
                    style={{
                        colorMode: 'colorful',
                        colorPalette: 'colorful',
                        orientation: 'mixed',
                        rotateRatio: 0.4
                    }}
                    engine="ggwordcloud-style"
                />
            </main>

            {/* Footer / Stats */}
            <footer className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent text-white z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                        <Users size={24} />
                        <span className="text-xl font-bold">{participantCount} Katılımcı</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg">
                        <QrCode className="text-black" size={48} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm opacity-80">Katılmak için tarayın</p>
                        <p className="text-2xl font-bold tracking-widest">KS-Cloud</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
