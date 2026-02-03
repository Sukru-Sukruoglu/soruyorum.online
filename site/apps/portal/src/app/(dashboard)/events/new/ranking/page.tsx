"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Play, Pause, Square, ExternalLink,
    Users, Settings, Monitor, Plus, Trash2,
    RefreshCcw, Save, Upload, Music, Image as ImageIcon,
    Layout, Type
} from 'lucide-react'

// Types
type Participant = {
    id: string
    name: string
    targetScore: number
    displayScore: number
    color: string
    avatar: string
    isFinished: boolean
}

type CompetitionSettings = {
    title: string
    subtitle: string
    layout: 'horizontal' | 'vertical'
    animationSpeed: number
    logoUrl: string | null
    logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    logoSize: number
    backgroundType: 'gradient' | 'solid' | 'image'
    customBackgroundUrl: string | null
    audioUrl: string | null
    audioEnabled: boolean
}

const DEFAULT_PARTICIPANTS: Participant[] = [
    { id: '1', name: 'Yarışmacı 1', targetScore: 85, displayScore: 0, color: '#3B82F6', avatar: '', isFinished: false },
    { id: '2', name: 'Yarışmacı 2', targetScore: 92, displayScore: 0, color: '#EF4444', avatar: '', isFinished: false },
    { id: '3', name: 'Yarışmacı 3', targetScore: 78, displayScore: 0, color: '#10B981', avatar: '', isFinished: false },
    { id: '4', name: 'Yarışmacı 4', targetScore: 65, displayScore: 0, color: '#F59E0B', avatar: '', isFinished: false },
    { id: '5', name: 'Yarışmacı 5', targetScore: 95, displayScore: 0, color: '#8B5CF6', avatar: '', isFinished: false },
]

export default function AdminPage() {
    // State
    const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS)
    const [settings, setSettings] = useState<CompetitionSettings>({
        title: 'YARIŞMA ADI',
        subtitle: 'Final Sıralaması',
        layout: 'horizontal',
        animationSpeed: 400,
        logoUrl: null,
        logoPosition: 'top-right',
        logoSize: 100,
        backgroundType: 'gradient',
        customBackgroundUrl: null,
        audioUrl: null,
        audioEnabled: true
    })

    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const displayWindowRef = useRef<Window | null>(null)

    // Listen for callbacks from Display
    useEffect(() => {
        const checkCallback = () => {
            const callbackStr = localStorage.getItem('displayCallback')
            if (callbackStr) {
                try {
                    const callback = JSON.parse(callbackStr)
                    if (callback.action === 'ANIMATION_FINISHED') {
                        setIsRunning(false)
                        setIsPaused(false)
                        console.log('Animation finished:', callback)
                    }
                } catch (e) {
                    console.error('Callback parse error', e)
                }
                localStorage.removeItem('displayCallback')
            }
        }

        const timer = setInterval(checkCallback, 500)
        return () => clearInterval(timer)
    }, [])

    // Send commands to display
    const sendCommand = useCallback((action: string, data: any = {}) => {
        const command = {
            action,
            data,
            timestamp: Date.now()
        }
        localStorage.setItem('competitionCommand', JSON.stringify(command))

        // Also update local state if needed
        if (action === 'START_ANIMATION') {
            setIsRunning(true)
            setIsPaused(false)
        } else if (action === 'STOP_ANIMATION') {
            setIsRunning(false)
            setIsPaused(false)
        } else if (action === 'PAUSE_ANIMATION') {
            setIsPaused(true)
        } else if (action === 'RESUME_ANIMATION') {
            setIsPaused(false)
        }
    }, [])

    // Sync participants and settings when they change (if live update is desired)
    // Or purely on button click. Let's do it on button click for Start, but update data live.
    useEffect(() => {
        // Send background/settings updates in real-time
        sendCommand('UPDATE_SETTINGS', { settings, participants })
    }, [settings, participants, sendCommand])

    const handleStart = () => {
        sendCommand('START_ANIMATION', { participants, settings })
    }

    const handleStop = () => {
        sendCommand('STOP_ANIMATION')
    }

    const handlePause = () => {
        if (isPaused) {
            sendCommand('RESUME_ANIMATION')
        } else {
            sendCommand('PAUSE_ANIMATION')
        }
    }

    const openDisplay = () => {
        if (displayWindowRef.current && !displayWindowRef.current.closed) {
            displayWindowRef.current.focus()
        } else {
            // PORTAL INTEGRATION CHANGE: Point to the internal presentation route
            displayWindowRef.current = window.open('/presentation/ranking/default', 'ScoreDisplay', 'width=1920,height=1080')
        }
    }

    const generateRandomParticipants = (count: number) => {
        const newParticipants: Participant[] = []
        const names = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Hakan', 'Deniz', 'Can']

        for (let i = 0; i < count; i++) {
            const name = `${names[Math.floor(Math.random() * names.length)]} ${String.fromCharCode(65 + i)}.`
            newParticipants.push({
                id: crypto.randomUUID(),
                name,
                targetScore: Math.floor(Math.random() * 50) + 50, // 50-100
                displayScore: 0,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                avatar: '',
                isFinished: false
            })
        }
        setParticipants(newParticipants)
    }

    // File handlers (Mocking URL.createObjectURL for demo)
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setSettings(prev => ({ ...prev, logoUrl: url }))
        }
    }

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setSettings(prev => ({ ...prev, audioUrl: url }))
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl leading-none">Admin Panel</h1>
                        <p className="text-xs text-slate-400">Yarışma Kontrol Sistemi</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={openDisplay}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Display Ekranı Aç
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 grid grid-cols-12 gap-6">
                {/* Left Column - Settings */}
                <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">

                    {/* Main Controls */}
                    <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                        <h2 className="flex items-center gap-2 font-semibold mb-4 text-indigo-400">
                            <Monitor className="w-5 h-5" />
                            Yayın Kontrolü
                        </h2>

                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={handleStart}
                                disabled={isRunning && !isPaused}
                                className="flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-green-900/20"
                            >
                                <Play className="w-6 h-6" fill="currentColor" />
                                BAŞLAT
                            </button>

                            <button
                                onClick={handlePause}
                                disabled={!isRunning}
                                className="flex flex-col items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-amber-900/20"
                            >
                                <Pause className="w-6 h-6" fill="currentColor" />
                                {isPaused ? 'DEVAM ET' : 'DURAKLAT'}
                            </button>

                            <button
                                onClick={handleStop}
                                disabled={!isRunning}
                                className="flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-red-900/20"
                            >
                                <Square className="w-6 h-6" fill="currentColor" />
                                SIFIRLA
                            </button>
                        </div>
                    </section>

                    {/* General Settings */}
                    <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <h2 className="flex items-center gap-2 font-semibold mb-4 text-indigo-400">
                            <Type className="w-5 h-5" />
                            Başlık & İçerik
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Yarışma Başlığı</label>
                                <input
                                    type="text"
                                    value={settings.title}
                                    onChange={e => setSettings({ ...settings, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Alt Başlık</label>
                                <input
                                    type="text"
                                    value={settings.subtitle}
                                    onChange={e => setSettings({ ...settings, subtitle: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Appearance Settings */}
                    <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <h2 className="flex items-center gap-2 font-semibold mb-4 text-indigo-400">
                            <Layout className="w-5 h-5" />
                            Görünüm Ayarları
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Yerleşim Düzeni</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSettings({ ...settings, layout: 'horizontal' })}
                                        className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${settings.layout === 'horizontal' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-slate-700 hover:bg-slate-700'}`}
                                    >
                                        <div className="rotate-90"><Layout size={14} /></div> Yatay
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, layout: 'vertical' })}
                                        className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 ${settings.layout === 'vertical' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-slate-700 hover:bg-slate-700'}`}
                                    >
                                        <Layout size={14} /> Dikey
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Animasyon Hızı ({settings.animationSpeed}ms)</label>
                                <input
                                    type="range"
                                    min="50" max="1000" step="50"
                                    value={settings.animationSpeed}
                                    onChange={e => setSettings({ ...settings, animationSpeed: Number(e.target.value) })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Logo</label>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg p-2 flex items-center justify-center gap-2 text-sm text-slate-400 transition-colors">
                                        <Upload size={14} />
                                        Logo Seç
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    </label>
                                    {settings.logoUrl && (
                                        <button
                                            onClick={() => setSettings({ ...settings, logoUrl: null })}
                                            className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Audio Settings (Extra) */}
                    <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <h2 className="flex items-center gap-2 font-semibold mb-4 text-indigo-400">
                            <Music className="w-5 h-5" />
                            Ses Efektleri
                        </h2>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm">Müzik Çal</span>
                            <button
                                onClick={() => setSettings({ ...settings, audioEnabled: !settings.audioEnabled })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.audioEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.audioEnabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <label className="w-full cursor-pointer bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg p-2 flex items-center justify-center gap-2 text-sm text-slate-400 transition-colors">
                            <Upload size={14} />
                            MP3 Dosyası Seç
                            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                        </label>
                    </section>

                </div>

                {/* Right Column - Participants */}
                <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="flex items-center gap-2 font-semibold text-indigo-400">
                            <Users className="w-5 h-5" />
                            Katılımcılar ({participants.length})
                        </h2>

                        <div className="flex gap-2">
                            <button
                                onClick={() => generateRandomParticipants(10)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <RefreshCcw size={12} />
                                Demo Data (10)
                            </button>

                            <button
                                onClick={() => setParticipants([...participants, {
                                    id: crypto.randomUUID(),
                                    name: `Yeni Yarışmacı ${participants.length + 1}`,
                                    targetScore: 0,
                                    displayScore: 0,
                                    color: '#3B82F6',
                                    avatar: '',
                                    isFinished: false
                                }])}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <Plus size={12} />
                                Ekle
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-2 custom-scrollbar">
                        {participants.map((p, idx) => (
                            <div key={p.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-4 hover:border-slate-600 transition-colors group">
                                <span className="text-slate-500 font-mono w-6">{idx + 1}</span>

                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: p.color }}>
                                    {p.avatar ? (
                                        <img src={p.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="text-white text-xs font-bold">{p.name.substring(0, 1)}</span>
                                    )}
                                </div>

                                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={e => {
                                                const newP = [...participants]
                                                newP[idx].name = e.target.value
                                                setParticipants(newP)
                                            }}
                                            className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-indigo-500 outline-none text-sm py-1 transition-colors"
                                        />
                                    </div>

                                    <div className="col-span-3 flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Puan:</span>
                                        <input
                                            type="number"
                                            value={p.targetScore}
                                            onChange={e => {
                                                const newP = [...participants]
                                                newP[idx].targetScore = Number(e.target.value)
                                                setParticipants(newP)
                                            }}
                                            className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-center focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="col-span-3 flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Renk:</span>
                                        <input
                                            type="color"
                                            value={p.color}
                                            onChange={e => {
                                                const newP = [...participants]
                                                newP[idx].color = e.target.value
                                                setParticipants(newP)
                                            }}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setParticipants(participants.filter(x => x.id !== p.id))}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {participants.length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                                <Users size={32} className="opacity-20" />
                                <p>Henüz katılımcı eklenmedi</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
