"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import {
    Play, Pause, Square, ExternalLink,
    Settings, Monitor, Plus, Trash2,
    RefreshCcw, Upload, Music, Gift,
    Layout, Type, Palette, Eye, Save,
    ChevronDown, Percent, Package, Sparkles,
    Shield, Key, Copy, Lock, UserCheck, ArrowLeft,
    Flag, X, Download, FileText, Users, Trophy, XCircle
} from 'lucide-react'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { generateAccessCodes, getAccessCodes, toggleAccessCodes, deleteAccessCode, getWheelData, saveWheelData, endEventAndGenerateReport } from '@/app/actions/wheel'

// Types
type Prize = {
    id: string
    name: string
    description: string
    color: string
    icon: string
    probability: number
    stockQuantity: number
    remainingStock: number
    isActive: boolean
    displayOrder: number
}

type WheelSettings = {
    title: string | null
    subtitle: string | null
    spinDuration: number
    enableSound: boolean
    enableConfetti: boolean
    wheelSize: number
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string
    enableAccessCodes: boolean
    requireIdentityNumber?: boolean
    requirePhone?: boolean
    requireEmail?: boolean
}

type AccessCode = {
    id: string
    code: string
    isUsed: boolean
    usedAt: Date | null
    createdAt: Date
    participantName?: string | null
    participantEmail?: string | null
    participantPhone?: string | null
    prize_name?: string | null
}

const ICONS = [
    { id: 'Gift', label: 'Hediye' },
    { id: 'Star', label: 'Yıldız' },
    { id: 'Trophy', label: 'Kupa' },
    { id: 'Crown', label: 'Taç' },
    { id: 'Heart', label: 'Kalp' },
    { id: 'Gem', label: 'Mücevher' },
    { id: 'Ticket', label: 'Bilet' },
    { id: 'Coffee', label: 'Kahve' },
    { id: 'Pizza', label: 'Pizza' },
    { id: 'Smartphone', label: 'Telefon' },
]

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
]

// Vibrant rainbow colors for wheel slices
const VIBRANT_COLORS = [
    '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#ADFF2F', '#00FF00',
    '#00FA9A', '#00FFFF', '#00BFFF', '#1E90FF', '#4169E1', '#8A2BE2',
    '#9400D3', '#FF00FF', '#FF1493', '#DC143C', '#FF6347', '#FFA500',
    '#32CD32', '#00CED1', '#4682B4', '#6A5ACD', '#BA55D3', '#C71585'
]

const DEFAULT_PRIZES: Prize[] = [
    { id: '1', name: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro 256GB', color: VIBRANT_COLORS[0], icon: 'Smartphone', probability: 1, stockQuantity: 1, remainingStock: 1, isActive: true, displayOrder: 0 },
    { id: '2', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[1], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 1 },
    { id: '3', name: '%50 İndirim', description: 'Tüm ürünlerde %50 indirim', color: VIBRANT_COLORS[2], icon: 'Ticket', probability: 3, stockQuantity: 50, remainingStock: 50, isActive: true, displayOrder: 2 },
    { id: '4', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[3], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 3 },
    { id: '5', name: 'Kahve Hediye', description: 'Starbucks hediye kartı', color: VIBRANT_COLORS[4], icon: 'Coffee', probability: 5, stockQuantity: 100, remainingStock: 100, isActive: true, displayOrder: 4 },
    { id: '6', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[5], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 5 },
    { id: '7', name: 'AirPods', description: 'Apple AirPods Pro 2', color: VIBRANT_COLORS[6], icon: 'Crown', probability: 2, stockQuantity: 5, remainingStock: 5, isActive: true, displayOrder: 6 },
    { id: '8', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[7], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 7 },
    { id: '9', name: 'Pizza Hediye', description: 'Büyük boy pizza', color: VIBRANT_COLORS[8], icon: 'Pizza', probability: 4, stockQuantity: 50, remainingStock: 50, isActive: true, displayOrder: 8 },
    { id: '10', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[9], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 9 },
    { id: '11', name: 'Watch SE', description: 'Apple Watch SE', color: VIBRANT_COLORS[10], icon: 'Trophy', probability: 2, stockQuantity: 3, remainingStock: 3, isActive: true, displayOrder: 10 },
    { id: '12', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[11], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 11 },
    { id: '13', name: 'Sinema Bileti', description: '2 kişilik sinema bileti', color: VIBRANT_COLORS[12], icon: 'Ticket', probability: 4, stockQuantity: 30, remainingStock: 30, isActive: true, displayOrder: 12 },
    { id: '14', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[13], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 13 },
    { id: '15', name: 'MacBook Air', description: 'MacBook Air M3', color: VIBRANT_COLORS[14], icon: 'Crown', probability: 1, stockQuantity: 1, remainingStock: 1, isActive: true, displayOrder: 14 },
    { id: '16', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[15], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 15 },
    { id: '17', name: 'Kulaklık', description: 'Bluetooth kulaklık', color: VIBRANT_COLORS[16], icon: 'Gem', probability: 3, stockQuantity: 20, remainingStock: 20, isActive: true, displayOrder: 16 },
    { id: '18', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[17], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 17 },
    { id: '19', name: 'T-Shirt', description: 'Limited edition t-shirt', color: VIBRANT_COLORS[18], icon: 'Star', probability: 4, stockQuantity: 40, remainingStock: 40, isActive: true, displayOrder: 18 },
    { id: '20', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[19], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 19 },
    { id: '21', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[20], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 20 },
    { id: '22', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[21], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 21 },
    { id: '23', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[22], icon: 'Heart', probability: 6, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 22 },
    { id: '24', name: 'Kazanamadınız', description: 'Tekrar dene', color: VIBRANT_COLORS[23], icon: 'Heart', probability: 4, stockQuantity: -1, remainingStock: -1, isActive: true, displayOrder: 23 },
]

function WheelOfFortuneAdminContent() {
    const searchParams = useSearchParams()
    const eventId = searchParams.get('id') || 'default'

    // State
    const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES)
    const [settings, setSettings] = useState<WheelSettings>({
        title: 'ÇARKI ÇEVİR KAZAN!',
        subtitle: 'Şansını dene, hediyeni kap!',
        spinDuration: 5000,
        enableSound: true,
        enableConfetti: true,
        wheelSize: 600,
        logoUrl: null,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        enableAccessCodes: false,
    })

    // Security State
    const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
    const [generateCount, setGenerateCount] = useState(50)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'content' | 'registration' | 'prizes' | 'appearance'>('content')
    const [showReportModal, setShowReportModal] = useState(false)
    const [reportData, setReportData] = useState<any>(null)
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)

    // Load Data
    useEffect(() => {
        if (eventId && eventId !== 'default') {
            const load = async () => {
                const data = await getWheelData(eventId)
                if (data && data.settings) {
                    const s = data.settings;
                    setSettings(prev => ({
                        ...prev,
                        ...s,
                        title: s.title || prev.title,
                        subtitle: s.subtitle || prev.subtitle,
                        wheelSize: s.wheelSize ? Number(s.wheelSize) : prev.wheelSize,
                        spinDuration: s.spinDuration ? Number(s.spinDuration) : prev.spinDuration
                    }))
                }
                if (data && data.prizes && data.prizes.length > 0) {
                    setPrizes(data.prizes.map(p => ({
                        ...p,
                        probability: Number(p.probability)
                    } as any)))
                }
            }
            load()
        }
    }, [eventId])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveWheelData(eventId, { settings, prizes })
            alert('Başarıyla kaydedildi!')
        } catch (error) {
            console.error('Save error:', error)
            alert('Kaydedilirken bir hata oluştu.')
        } finally {
            setIsSaving(false)
        }
    }

    // Fetch codes on load and poll
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (activeTab === 'registration') {
            loadAccessCodes()
            interval = setInterval(loadAccessCodes, 5000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [activeTab])

    const loadAccessCodes = async () => {
        try {
            const codes = await getAccessCodes(eventId)
            setAccessCodes(codes)
        } catch (error) {
            console.error('Error loading codes:', error)
        }
    }

    const handleGenerateCodes = async () => {
        setIsGenerating(true)
        try {
            await generateAccessCodes(eventId, generateCount)
            await loadAccessCodes()
            setGenerateCount(50) // Reset
        } catch (error) {
            console.error('Error generating codes:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDeleteCode = async (id: string) => {
        try {
            await deleteAccessCode(id)
            setAccessCodes(prev => prev.filter(c => c.id !== id))
        } catch (error) {
            console.error('Error deleting code:', error)
        }
    }

    const handleToggleSecurity = async (enabled: boolean) => {
        setSettings(prev => ({ ...prev, enableAccessCodes: enabled }))
        try {
            await toggleAccessCodes(eventId, enabled)
        } catch (error) {
            console.error('Error toggling security:', error)
            // Revert on error
            setSettings(prev => ({ ...prev, enableAccessCodes: !enabled }))
        }
    }

    const copyUnusedCodes = () => {
        const unused = accessCodes.filter(c => !c.isUsed).map(c => c.code).join('\n')
        navigator.clipboard.writeText(unused)
        alert('Kullanılmayan kodlar kopyalandı!')
    }

    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    // removed redundant activeTab
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
    const displayWindowRef = useRef<Window | null>(null)

    // Calculate total probability
    const totalProbability = prizes.filter(p => p.isActive).reduce((sum, p) => sum + p.probability, 0)

    // Listen for callbacks from Display
    useEffect(() => {
        const checkCallback = () => {
            const callbackStr = localStorage.getItem('wheelCallback')
            if (callbackStr) {
                try {
                    const callback = JSON.parse(callbackStr)
                    if (callback.action === 'SPIN_FINISHED') {
                        setIsRunning(false)
                        setIsPaused(false)
                        console.log('Spin finished:', callback)
                    }
                } catch (e) {
                    console.error('Callback parse error', e)
                }
                localStorage.removeItem('wheelCallback')
            }
        }

        const timer = setInterval(checkCallback, 500)
        return () => clearInterval(timer)
    }, [])

    // Send commands to display
    const sendCommand = useCallback((action: string, data: object = {}) => {
        const command = {
            action,
            data,
            timestamp: Date.now()
        }
        localStorage.setItem('wheelCommand', JSON.stringify(command))

        if (action === 'START_SPIN') {
            setIsRunning(true)
            setIsPaused(false)
        } else if (action === 'STOP_SPIN') {
            setIsRunning(false)
            setIsPaused(false)
        } else if (action === 'PAUSE_SPIN') {
            setIsPaused(true)
        } else if (action === 'RESUME_SPIN') {
            setIsPaused(false)
        }
    }, [])

    // Sync data
    useEffect(() => {
        sendCommand('UPDATE_DATA', { settings, prizes })
    }, [settings, prizes, sendCommand])

    const handleSpin = () => {
        // Select winner based on probability
        const activePrizes = prizes.filter(p => p.isActive && (p.remainingStock === -1 || p.remainingStock > 0))
        const total = activePrizes.reduce((sum, p) => sum + p.probability, 0)
        let random = Math.random() * total

        let winner = activePrizes[0]
        for (const prize of activePrizes) {
            random -= prize.probability
            if (random <= 0) {
                winner = prize
                break
            }
        }

        sendCommand('START_SPIN', { prizes: activePrizes, settings, winnerId: winner.id })
    }

    const handleStop = () => {
        sendCommand('STOP_SPIN')
    }

    const openDisplay = () => {
        if (displayWindowRef.current && !displayWindowRef.current.closed) {
            displayWindowRef.current.focus()
        } else {
            displayWindowRef.current = window.open('/presentation/wheeloffortune/default', 'WheelDisplay', 'width=1920,height=1080')
        }
    }

    const addPrize = () => {
        const newPrize: Prize = {
            id: crypto.randomUUID(),
            name: `Yeni Hediye ${prizes.length + 1}`,
            description: '',
            color: COLORS[prizes.length % COLORS.length],
            icon: 'Gift',
            probability: 10,
            stockQuantity: -1,
            remainingStock: -1,
            isActive: true,
            displayOrder: prizes.length,
        }
        setPrizes([...prizes, newPrize])
        setEditingPrize(newPrize)
    }

    const updatePrize = (id: string, updates: Partial<Prize>) => {
        setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
        if (editingPrize?.id === id) {
            setEditingPrize(prev => prev ? { ...prev, ...updates } : null)
        }
    }

    const deletePrize = (id: string) => {
        setPrizes(prev => prev.filter(p => p.id !== id))
        if (editingPrize?.id === id) {
            setEditingPrize(null)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setSettings(prev => ({ ...prev, logoUrl: url }))
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl leading-none">Hediye Çarkı Admin</h1>
                        <p className="text-xs text-slate-400">Hediye Çarkı Yönetimi</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard">
                        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Etkinliklerime Dön
                        </button>
                    </Link>
                    <button
                        onClick={async () => {
                            if (!confirm('Etkinliği sonlandırmak istediğinize emin misiniz? Bu işlem rapor oluşturacaktır.')) return
                            setIsGeneratingReport(true)
                            try {
                                const result = await endEventAndGenerateReport(eventId)
                                if (result.success && result.report) {
                                    setReportData(result.report)
                                    setShowReportModal(true)
                                } else {
                                    alert(result.message || 'Rapor oluşturulamadı.')
                                }
                            } catch (e) {
                                console.error(e)
                                alert('Bir hata oluştu.')
                            } finally {
                                setIsGeneratingReport(false)
                            }
                        }}
                        disabled={isGeneratingReport}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg border border-red-500 transition-colors disabled:opacity-50"
                    >
                        <Flag className="w-4 h-4" />
                        {isGeneratingReport ? 'Rapor Oluşturuluyor...' : 'Etkinliği Sonlandır'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg border border-green-500 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
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
                {/* Left Column - Controls & Settings */}
                <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">

                    {/* Main Controls */}
                    <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                        <h2 className="flex items-center gap-2 font-semibold mb-4 text-amber-400">
                            <Monitor className="w-5 h-5" />
                            Çark Kontrolü
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleSpin}
                                disabled={isRunning || totalProbability === 0}
                                className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-green-900/20 col-span-2"
                            >
                                <Play className="w-8 h-8" fill="currentColor" />
                                ÇARKI ÇEVİR
                            </button>

                            <button
                                onClick={handleStop}
                                disabled={!isRunning}
                                className="flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-red-900/20"
                            >
                                <Square className="w-6 h-6" fill="currentColor" />
                                SIFIRLA
                            </button>

                            <button
                                onClick={() => sendCommand(isPaused ? 'RESUME_SPIN' : 'PAUSE_SPIN')}
                                disabled={!isRunning}
                                className="flex flex-col items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-xl transition-all font-medium shadow-lg shadow-amber-900/20"
                            >
                                <Pause className="w-6 h-6" fill="currentColor" />
                                {isPaused ? 'DEVAM' : 'DURAKLAT'}
                            </button>
                        </div>

                        {/* Probability Warning */}
                        {totalProbability !== 100 && (
                            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${totalProbability > 100 ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                                <Percent className="w-4 h-4" />
                                Toplam olasılık: %{totalProbability.toFixed(1)} {totalProbability !== 100 && `(Önerilen: %100)`}
                            </div>
                        )}
                    </section>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 overflow-x-auto">
                        {[
                            { id: 'content', icon: Layout, label: 'Bilgiler' },
                            { id: 'registration', icon: Shield, label: 'Kayıt' },
                            { id: 'prizes', icon: Gift, label: 'Ödüller' },
                            { id: 'appearance', icon: Palette, label: 'Tema' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 py-3 text-xs transition-colors ${activeTab === tab.id
                                    ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/50'
                                    : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content (Bilgiler) Panel */}
                    {activeTab === 'content' && (
                        <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Başlık</label>
                                <input
                                    type="text"
                                    value={settings.title || ''}
                                    onChange={e => setSettings({ ...settings, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Alt Başlık</label>
                                <input
                                    type="text"
                                    value={settings.subtitle || ''}
                                    onChange={e => setSettings({ ...settings, subtitle: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </section>
                    )}

                    {/* Registration (Kayıt) Panel */}
                    {activeTab === 'registration' && (
                        <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 space-y-6">

                            {/* Access Code Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                <div>
                                    <h3 className="font-semibold text-white">Şifreli Giriş</h3>
                                    <p className="text-xs text-slate-400">Çarkı çevirmek için şifre gerektir</p>
                                </div>
                                <button
                                    onClick={() => handleToggleSecurity(!settings.enableAccessCodes)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableAccessCodes ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableAccessCodes ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Requirements Toggles */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-white border-b border-slate-700 pb-2">Kayıt Formu Alanları</h3>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">İsim Soyisim (Zorunlu)</span>
                                    <button disabled className="w-12 h-6 rounded-full bg-amber-500/50 relative cursor-not-allowed">
                                        <span className="absolute top-1 w-4 h-4 bg-white rounded-full left-7" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">TC Kimlik No</span>
                                    <button
                                        onClick={() => setSettings({ ...settings, requireIdentityNumber: !settings.requireIdentityNumber })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.requireIdentityNumber ? 'bg-amber-500' : 'bg-slate-700'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.requireIdentityNumber ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Telefon</span>
                                    <button
                                        onClick={() => setSettings({ ...settings, requirePhone: !settings.requirePhone })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.requirePhone ? 'bg-amber-500' : 'bg-slate-700'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.requirePhone ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">E-Posta</span>
                                    <button
                                        onClick={() => setSettings({ ...settings, requireEmail: !settings.requireEmail })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.requireEmail ? 'bg-amber-500' : 'bg-slate-700'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.requireEmail ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {settings.enableAccessCodes && (
                                <div className="mt-8 pt-6 border-t border-slate-700">
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Key size={16} />
                                        Kod Yönetimi
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={handleGenerateCodes}
                                            disabled={isGenerating}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={14} />
                                            {isGenerating ? '...' : '50 Kod Üret'}
                                        </button>
                                        <button
                                            onClick={copyUnusedCodes}
                                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                                            title="Kullanılmayanları Kopyala"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto bg-slate-900 rounded-lg border border-slate-700">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3">Kod</th>
                                                    <th className="px-4 py-3">İsim Soyisim</th>
                                                    <th className="px-4 py-3">Telefon</th>
                                                    <th className="px-4 py-3">E-Posta</th>
                                                    <th className="px-4 py-3">Sonuç</th>
                                                    <th className="px-4 py-3 text-right">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {accessCodes.map(code => (
                                                    <tr key={code.id} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className={`font-mono font-bold tracking-widest ${code.isUsed ? 'text-slate-500' : 'text-emerald-400'}`}>
                                                                {code.code}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-300">
                                                            {code.participantName || <span className="text-slate-600">-</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-300">
                                                            {code.participantPhone || <span className="text-slate-600">-</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-400">
                                                            {code.participantEmail || <span className="text-slate-600">-</span>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {code.isUsed ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${code.prize_name?.toLowerCase().includes('kazanamadı')
                                                                    ? 'bg-slate-700 text-slate-400'
                                                                    : 'bg-green-900/30 text-green-400'
                                                                    }`}>
                                                                    {code.prize_name || 'Kazandı'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-600 italic">Bekliyor</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button onClick={() => handleDeleteCode(code.id)} className="text-red-400 hover:text-red-300 p-1">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {accessCodes.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                            Henüz kayıt bulunamadı.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </section>
                    )}

                    {/* Appearance (Tema) Panel */}
                    {activeTab === 'appearance' && (
                        <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Dönüş Süresi ({settings.spinDuration}ms)</label>
                                <input
                                    type="range"
                                    min="3000" max="10000" step="500"
                                    value={settings.spinDuration}
                                    onChange={e => setSettings({ ...settings, spinDuration: Number(e.target.value) })}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Ses Efektleri</span>
                                <button
                                    onClick={() => setSettings({ ...settings, enableSound: !settings.enableSound })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableSound ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableSound ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Konfeti Efekti</span>
                                <button
                                    onClick={() => setSettings({ ...settings, enableConfetti: !settings.enableConfetti })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableConfetti ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableConfetti ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="pt-4 border-t border-slate-700">
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
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">Ana Renk</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <span className="text-sm text-slate-400">{settings.primaryColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">İkincil Renk</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.secondaryColor}
                                        onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                    />
                                    <span className="text-sm text-slate-400">{settings.secondaryColor}</span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column - Prize List */}
                <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                        <h2 className="flex items-center gap-2 font-semibold text-amber-400">
                            <Gift className="w-5 h-5" />
                            Hediyeler ({prizes.length})
                        </h2>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPrizes(DEFAULT_PRIZES)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <RefreshCcw size={12} />
                                Demo Data
                            </button>

                            <button
                                onClick={addPrize}
                                className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <Plus size={12} />
                                Hediye Ekle
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {/* Prize List */}
                        <div className="p-4 space-y-2">
                            {prizes.map((prize, idx) => (
                                <div
                                    key={prize.id}
                                    className={`bg-slate-900/50 p-4 rounded-lg border transition-all cursor-pointer group ${editingPrize?.id === prize.id
                                        ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                                        : 'border-slate-700/50 hover:border-slate-600'
                                        }`}
                                    onClick={() => setEditingPrize(prize)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500 font-mono w-6">{idx + 1}</span>

                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                                            style={{ backgroundColor: prize.color }}
                                        >
                                            <Gift size={20} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{prize.name}</span>
                                                {!prize.isActive && (
                                                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">Pasif</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Percent size={12} />
                                                    %{prize.probability}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Package size={12} />
                                                    {prize.stockQuantity === -1 ? 'Sınırsız' : `${prize.remainingStock}/${prize.stockQuantity}`}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); deletePrize(prize.id); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Expanded Edit Form */}
                                    {editingPrize?.id === prize.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Hediye Adı</label>
                                                    <input
                                                        type="text"
                                                        value={prize.name}
                                                        onChange={e => updatePrize(prize.id, { name: e.target.value })}
                                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Açıklama</label>
                                                    <input
                                                        type="text"
                                                        value={prize.description}
                                                        onChange={e => updatePrize(prize.id, { description: e.target.value })}
                                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Olasılık (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0" max="100" step="0.1"
                                                        value={prize.probability}
                                                        onChange={e => updatePrize(prize.id, { probability: Number(e.target.value) })}
                                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Stok (-1 = sınırsız)</label>
                                                    <input
                                                        type="number"
                                                        min="-1"
                                                        value={prize.stockQuantity}
                                                        onChange={e => updatePrize(prize.id, { stockQuantity: Number(e.target.value), remainingStock: Number(e.target.value) })}
                                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Renk</label>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {COLORS.slice(0, 8).map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => updatePrize(prize.id, { color })}
                                                                className={`w-6 h-6 rounded ${prize.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <label className="text-sm">Aktif</label>
                                                <button
                                                    onClick={() => updatePrize(prize.id, { isActive: !prize.isActive })}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${prize.isActive ? 'bg-green-500' : 'bg-slate-700'}`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${prize.isActive ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {prizes.length === 0 && (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                                    <Gift size={32} className="opacity-20" />
                                    <p>Henüz hediye eklenmedi</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            </main >

            {/* Report Modal */}
            {showReportModal && reportData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-7 h-7 text-white" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Etkinlik Raporu</h2>
                                    <p className="text-sm text-white/80">{reportData.eventName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                    <div className="text-2xl font-bold text-white">{reportData.summary.totalCodes || reportData.summary.totalParticipants || 0}</div>
                                    <div className="text-sm text-slate-400">Toplam Kod</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                    <div className="text-2xl font-bold text-white">{reportData.summary.totalWinners}</div>
                                    <div className="text-sm text-slate-400">Kazananlar</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                    <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                    <div className="text-2xl font-bold text-white">{reportData.summary.totalLosers}</div>
                                    <div className="text-sm text-slate-400">Kazanamayanlar</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                                    <div className="text-2xl font-bold text-white">{reportData.summary.usedCodes || reportData.summary.totalSpins || 0}</div>
                                    <div className="text-sm text-slate-400">Kullanılan Kod</div>
                                </div>
                            </div>

                            {/* Prize Distribution */}
                            <div className="bg-slate-700/30 rounded-xl p-4">
                                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                                    <Gift className="w-5 h-5" />
                                    Hediye Dağılımı
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(reportData.prizeDistribution).map(([prize, count]) => (
                                        <span
                                            key={prize}
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${prize.toLowerCase().includes('kazanamadı')
                                                ? 'bg-slate-600 text-slate-300'
                                                : 'bg-green-600/20 text-green-400 border border-green-500/30'
                                                }`}
                                        >
                                            {prize}: {count as number}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Participants Table */}
                            <div className="bg-slate-700/30 rounded-xl overflow-hidden">
                                <h3 className="font-semibold text-amber-400 p-4 flex items-center gap-2 border-b border-slate-600">
                                    <Users className="w-5 h-5" />
                                    Katılımcı Listesi ({reportData.participants.length})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="text-left p-3 text-slate-300">#</th>
                                                <th className="text-left p-3 text-slate-300">Kod</th>
                                                <th className="text-left p-3 text-slate-300">İsim Soyisim</th>
                                                <th className="text-left p-3 text-slate-300">Telefon</th>
                                                <th className="text-left p-3 text-slate-300">E-Posta</th>
                                                <th className="text-left p-3 text-slate-300">Sonuç</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.participants.map((p: any, i: number) => (
                                                <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                                                    <td className="p-3 text-slate-400">{i + 1}</td>
                                                    <td className="p-3 font-mono text-xs text-amber-400">{p.code}</td>
                                                    <td className="p-3 text-white">{p.name}</td>
                                                    <td className="p-3 text-slate-300">{p.phone}</td>
                                                    <td className="p-3 text-slate-300">{p.email}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${p.isWinner
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-slate-600 text-slate-400'
                                                            }`}>
                                                            {p.prize}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-700 p-4 flex justify-end gap-3 bg-slate-800/80">
                            <button
                                onClick={() => {
                                    // Export as CSV
                                    const headers = ['Kod', 'İsim', 'Telefon', 'E-Posta', 'Sonuç']
                                    const rows = reportData.participants.map((p: any) => [p.code, p.name, p.phone, p.email, p.prize])
                                    const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
                                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                                    const url = URL.createObjectURL(blob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = `etkinlik-rapor-${new Date().toISOString().split('T')[0]}.csv`
                                    link.click()
                                }}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                CSV İndir
                            </button>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    )
}

export default function WheelOfFortuneAdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Yükleniyor...</div>}>
            <WheelOfFortuneAdminContent />
        </Suspense>
    )
}
