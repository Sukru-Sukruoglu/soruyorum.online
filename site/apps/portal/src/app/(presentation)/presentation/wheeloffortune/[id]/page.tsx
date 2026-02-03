"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Gift, Star, Trophy, Crown, Heart, Gem, Ticket, Coffee, Pizza, Smartphone, Volume2, VolumeX, Lock, ArrowRight, Loader2, Play, Copy, UserCheck } from 'lucide-react'
import { verifyAccessCode, spinWheel, registerForWheel, getWheelData } from '@/app/actions/wheel'

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
    enableAccessCodes?: boolean
    qrCodeUrl?: string | null
    eventPin?: string | null
}

type Command = {
    action: string
    data: {
        prizes?: Prize[]
        settings?: WheelSettings
        winnerId?: string
    }
    timestamp: number
}

// Icon mapping
const IconMap: Record<string, React.ElementType> = {
    Gift, Star, Trophy, Crown, Heart, Gem, Ticket, Coffee, Pizza, Smartphone
}

// Confetti component
function Confetti({ active }: { active: boolean }) {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([])

    useEffect(() => {
        if (active) {
            const newParticles = Array.from({ length: 150 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77'][Math.floor(Math.random() * 9)],
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 2
            }))
            setParticles(newParticles)
        } else {
            setParticles([])
        }
    }, [active])

    if (!active) return null

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            <style jsx>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-3 h-3"
                    style={{
                        left: `${p.x}%`,
                        backgroundColor: p.color,
                        animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    }}
                />
            ))}
        </div>
    )
}

// Win Modal
function WinModal({ prize, onClose }: { prize: Prize | null; onClose: () => void }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onClose()
            }
        }
        if (prize) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [prize, onClose])

    if (!prize) return null

    const Icon = IconMap[prize.icon] || Gift
    const isLoss = prize.name.toLowerCase().includes('kazanamadı')

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-10 max-w-lg mx-4 text-center border border-slate-700 shadow-2xl animate-scale-in">
                <div
                    className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${isLoss ? '' : 'animate-bounce'}`}
                    style={{ backgroundColor: isLoss ? '#64748B' : prize.color }}
                >
                    <Icon size={48} className="text-white" />
                </div>

                <h2 className={`text-4xl font-bold mb-4 ${isLoss ? 'text-slate-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500'}`}>
                    {isLoss ? '😔 ÜZGÜNÜZ 😔' : '🎉 TEBRİKLER! 🎉'}
                </h2>

                <p className="text-2xl font-semibold text-white mb-2">{prize.name}</p>
                {prize.description && (
                    <p className="text-slate-400 mb-6">{prize.description}</p>
                )}

                <button
                    onClick={onClose}
                    className={`px-8 py-3 ${isLoss ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/25'} text-white font-bold rounded-xl hover:opacity-90 transition-opacity`}
                >
                    Tamam
                </button>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-scale-in { animation: scale-in 0.4s ease-out; }
            `}</style>
        </div>
    )
}

// NEW: Welcome Screen
function WelcomeScreen({ title, subtitle, onStart, qrCodeUrl, eventPin }: { title: string, subtitle: string, onStart: () => void, qrCodeUrl?: string | null, eventPin?: string | null }) {
    return (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black z-50 flex flex-col items-center justify-center overflow-hidden">
            {/* Animated Background Particles */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <div className="mb-8 animate-fade-in-down">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl rotate-3 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                        <Gift size={48} className="text-white" />
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-6 tracking-tight drop-shadow-sm animate-scale-in">
                    {title}
                </h1>

                <p className="text-xl md:text-3xl text-slate-300 font-light mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
                    {subtitle}
                </p>

                {qrCodeUrl && (
                    <div className="mb-10 animate-scale-in">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl shadow-white/10">
                            <img src={qrCodeUrl} alt="Katılım QR Kodu" className="w-48 h-48 md:w-56 md:h-56" />
                        </div>
                        {eventPin && (
                            <div className="mt-4">
                                <span className="text-slate-400 text-sm uppercase tracking-widest">Etkinlik PIN:</span>
                                <div className="text-3xl font-black text-amber-400 mt-1 tracking-[0.2em]">{eventPin}</div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onStart}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-orange-500 to-pink-500 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 animate-bounce-subtle hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20"
                >
                    <span className="absolute inset-0 transition-all duration-1000 scale-0 rounded-full bg-white opacity-20 group-hover:scale-105 group-hover:opacity-0"></span>
                    <span className="relative flex items-center gap-3">
                        Şansını Dene <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
            </div>

            {/* CSS for custom animations */}
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animate-fade-in-down {
                    animation: fadeInDown 1s ease-out;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 1s ease-out 0.3s backwards;
                }
                .animate-scale-in {
                    animation: scaleIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .animate-bounce-subtle {
                    animation: bounceSubtle 2s infinite;
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes bounceSubtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    )
}

// Redesigned Auth View
function AuthView({ eventId, settings, onLogin, onBack }: { eventId: string, settings: any, onLogin: (code: string, name: string) => void, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [identityNumber, setIdentityNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        const isMasterCode = code.trim().toUpperCase() === 'KS2026'

        if (!code.trim() || (!name.trim() && !isMasterCode)) {
            setError('Lütfen tüm alanları doldurun.')
            return
        }

        setIsLoading(true)
        setError('')

        const loginName = name.trim() || (isMasterCode ? 'Hediye Çarkı Admin' : '')

        try {
            const result = await verifyAccessCode(eventId, code)
            if (result.success) {
                onLogin(code, loginName)
            } else {
                setError(result.message || 'Geçersiz kod.')
            }
        } catch (err) {
            setError('Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('İsim zorunludur.')
            return
        }

        if (settings?.requireIdentityNumber && !identityNumber.trim()) {
            setError('TC Kimlik No zorunludur.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const result = await registerForWheel(eventId, { name, phone, email, identityNumber })
            if (result.success && result.code) {
                setGeneratedCode(result.code)
                setCode(result.code) // Pre-fill login code
            } else {
                setError(result.message || 'Kayıt başarısız.')
            }
        } catch (err) {
            setError('Bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    const updateActiveTabLogin = () => {
        setGeneratedCode(null) // Reset success screen
        setActiveTab('login') // Switch to login tab (code is already pre-filled)
    }

    if (generatedCode) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8 animate-scale-in text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                            <Trophy size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Kayıt Başarılı!</h2>
                        <p className="text-slate-400 mb-8">Etkinlik kodunuz başarıyla oluşturuldu.</p>

                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-8 relative group hover:border-green-500/50 transition-colors">
                            <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-semibold">GİRİŞ KODUNUZ</p>
                            <p className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500 tracking-widest">{generatedCode}</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(generatedCode)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Kopyala"
                            >
                                <Copy size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => updateActiveTabLogin()}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            Giriş Yap <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black z-50 flex items-center justify-center p-4">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20"
            >
                <ArrowRight className="rotate-180" size={20} /> Geri Dön
            </button>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 animate-scale-in relative">

                {/* Header Decoration */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-slate-900">
                        <div className="-rotate-45 text-white">
                            {activeTab === 'login' ? <Lock size={32} /> : <UserCheck size={32} />}
                        </div>
                    </div>
                </div>

                <div className="mt-8 mb-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {activeTab === 'login' ? 'Çarkı çevirmek için kodunu gir.' : 'Formu doldur ve şansını yakala!'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900/60 p-1.5 rounded-xl mb-8 border border-white/5">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'login' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === 'register' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                        Kayıt Ol
                    </button>
                </div>

                {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-bold ml-1 uppercase tracking-wider">Etkinlik Kodu</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="KODUNUZ"
                                className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white focus:ring-2 focus:ring-amber-500/20 outline-none placeholder:text-slate-700 transition-all placeholder:tracking-normal"
                            />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={code.toUpperCase() === 'KS2026' ? "Yönetici Girişi (İsim Opsiyonel)" : "Adınız Soyadınız"}
                            className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 rounded-xl px-4 py-3.5 text-center text-lg text-white focus:ring-2 focus:ring-amber-500/20 outline-none placeholder:text-slate-600 transition-all"
                        />
                        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-lg animate-pulse">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20">
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Giriş Yap <ArrowRight size={20} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ad Soyad *"
                            className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-green-500/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-slate-600 transition-all"
                        />
                        {settings?.requireIdentityNumber && (
                            <input
                                type="text"
                                maxLength={11}
                                value={identityNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setIdentityNumber(val)
                                }}
                                placeholder="TC Kimlik No *"
                                className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-green-500/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-slate-600 transition-all"
                            />
                        )}
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Telefon (Opsiyonel)"
                            className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-green-500/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-slate-600 transition-all"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-Posta (Opsiyonel)"
                            className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-green-500/50 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-green-500/20 outline-none placeholder:text-slate-600 transition-all"
                        />
                        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-2 rounded-lg">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Kayıt Ol <ArrowRight size={20} /></>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
function WheelCanvas({
    prizes,
    rotation,
    isSpinning
}: {
    prizes: Prize[]
    rotation: number
    isSpinning: boolean
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const size = 650
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 40

    // LED light positions
    const ledCount = 24
    const leds = useMemo(() => {
        return Array.from({ length: ledCount }, (_, i) => {
            const angle = (i / ledCount) * Math.PI * 2 - Math.PI / 2
            const ledRadius = radius + 25
            return {
                x: centerX + Math.cos(angle) * ledRadius,
                y: centerY + Math.sin(angle) * ledRadius,
                delay: i * 0.05
            }
        })
    }, [radius])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear
        ctx.clearRect(0, 0, size, size)

        const sliceAngle = (2 * Math.PI) / prizes.length

        // Draw outer ring (gold border)
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
        const goldGradient = ctx.createLinearGradient(0, 0, size, size)
        goldGradient.addColorStop(0, '#FFD700')
        goldGradient.addColorStop(0.3, '#FFA500')
        goldGradient.addColorStop(0.5, '#FFD700')
        goldGradient.addColorStop(0.7, '#FF8C00')
        goldGradient.addColorStop(1, '#FFD700')
        ctx.strokeStyle = goldGradient
        ctx.lineWidth = 12
        ctx.stroke()

        // Draw slices with gradients
        prizes.forEach((prize, index) => {
            const startAngle = index * sliceAngle - Math.PI / 2
            const endAngle = startAngle + sliceAngle
            const midAngle = startAngle + sliceAngle / 2

            // Create gradient for slice
            const gradientX = centerX + Math.cos(midAngle) * (radius * 0.5)
            const gradientY = centerY + Math.sin(midAngle) * (radius * 0.5)
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            )

            // Parse color and create lighter/darker versions
            const baseColor = prize.color
            gradient.addColorStop(0, lightenColor(baseColor, 40))
            gradient.addColorStop(0.3, lightenColor(baseColor, 20))
            gradient.addColorStop(0.6, baseColor)
            gradient.addColorStop(1, darkenColor(baseColor, 20))

            // Draw slice
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, startAngle, endAngle)
            ctx.closePath()
            ctx.fillStyle = gradient
            ctx.fill()

            // Inner glow effect
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, startAngle, endAngle)
            ctx.closePath()
            ctx.clip()

            const innerGlow = ctx.createRadialGradient(
                centerX, centerY, radius * 0.6,
                centerX, centerY, radius
            )
            innerGlow.addColorStop(0, 'rgba(255,255,255,0.15)')
            innerGlow.addColorStop(1, 'rgba(0,0,0,0.2)')
            ctx.fillStyle = innerGlow
            ctx.fill()
            ctx.restore()

            // White separator lines
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            const endX = centerX + Math.cos(startAngle) * radius
            const endY = centerY + Math.sin(startAngle) * radius
            ctx.lineTo(endX, endY)
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'
            ctx.lineWidth = 3
            ctx.stroke()

            ctx.restore()
        })

        // Inner decorative ring
        ctx.beginPath()
        ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI)
        const innerRingGradient = ctx.createLinearGradient(centerX - 55, centerY - 55, centerX + 55, centerY + 55)
        innerRingGradient.addColorStop(0, '#FFD700')
        innerRingGradient.addColorStop(0.5, '#FFA500')
        innerRingGradient.addColorStop(1, '#FFD700')
        ctx.strokeStyle = innerRingGradient
        ctx.lineWidth = 6
        ctx.stroke()

        // Center circle with 3D effect
        const centerGradient = ctx.createRadialGradient(
            centerX - 10, centerY - 10, 5,
            centerX, centerY, 45
        )
        centerGradient.addColorStop(0, '#4a5568')
        centerGradient.addColorStop(0.5, '#2d3748')
        centerGradient.addColorStop(1, '#1a202c')

        ctx.beginPath()
        ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI)
        ctx.fillStyle = centerGradient
        ctx.fill()

        // Center gold ring
        ctx.beginPath()
        ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI)
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 4
        ctx.stroke()

        // Center jewel
        const jewelGradient = ctx.createRadialGradient(
            centerX - 5, centerY - 5, 2,
            centerX, centerY, 20
        )
        jewelGradient.addColorStop(0, '#FFD700')
        jewelGradient.addColorStop(0.4, '#FFA500')
        jewelGradient.addColorStop(0.8, '#FF6B00')
        jewelGradient.addColorStop(1, '#CC5500')

        ctx.beginPath()
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
        ctx.fillStyle = jewelGradient
        ctx.fill()

        // Jewel highlight
        ctx.beginPath()
        ctx.arc(centerX - 5, centerY - 5, 6, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fill()

    }, [prizes])

    // Helper functions for color manipulation
    function lightenColor(color: string, percent: number): string {
        const num = parseInt(color.replace('#', ''), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.min(255, (num >> 16) + amt)
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
        const B = Math.min(255, (num & 0x0000FF) + amt)
        return `rgb(${R},${G},${B})`
    }

    function darkenColor(color: string, percent: number): string {
        const num = parseInt(color.replace('#', ''), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.max(0, (num >> 16) - amt)
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
        const B = Math.max(0, (num & 0x0000FF) - amt)
        return `rgb(${R},${G},${B})`
    }

    return (
        <div className="relative">
            {/* Outer glow ring */}
            <div
                className="absolute rounded-full"
                style={{
                    width: size + 60,
                    height: size + 60,
                    top: -30,
                    left: -30,
                    background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                }}
            />

            {/* LED Lights */}
            <div className="absolute inset-0" style={{ width: size, height: size }}>
                {leds.map((led, i) => (
                    <div
                        key={i}
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                            left: led.x - 8,
                            top: led.y - 8,
                            background: isSpinning
                                ? `radial-gradient(circle, ${i % 2 === 0 ? '#FFD700' : '#FF6B6B'} 0%, transparent 70%)`
                                : 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,165,0,0.4) 50%, transparent 70%)',
                            boxShadow: isSpinning
                                ? `0 0 10px ${i % 2 === 0 ? '#FFD700' : '#FF6B6B'}, 0 0 20px ${i % 2 === 0 ? '#FFD700' : '#FF6B6B'}50`
                                : '0 0 8px #FFD700, 0 0 15px #FFA50050',
                            animation: isSpinning ? `led-blink 0.2s ease-in-out ${led.delay}s infinite alternate` : 'led-pulse 2s ease-in-out infinite',
                        }}
                    />
                ))}
            </div>

            {/* Premium Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -15 }}>
                <div className="relative">
                    {/* Pointer glow */}
                    <div
                        className="absolute -inset-4 opacity-50"
                        style={{
                            background: 'radial-gradient(ellipse at center, #FFD700 0%, transparent 70%)',
                            filter: 'blur(10px)',
                        }}
                    />
                    {/* Pointer body */}
                    <svg width="50" height="60" viewBox="0 0 50 60" className="drop-shadow-2xl">
                        <defs>
                            <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#FFA500" />
                                <stop offset="100%" stopColor="#FF6B00" />
                            </linearGradient>
                            <filter id="pointerShadow">
                                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.5" />
                            </filter>
                        </defs>
                        <polygon
                            points="25,55 5,10 25,20 45,10"
                            fill="url(#pointerGradient)"
                            filter="url(#pointerShadow)"
                            stroke="#FFD700"
                            strokeWidth="2"
                        />
                        {/* Pointer jewel */}
                        <circle cx="25" cy="22" r="8" fill="#1a202c" stroke="#FFD700" strokeWidth="2" />
                        <circle cx="24" cy="21" r="3" fill="rgba(255,255,255,0.6)" />
                    </svg>
                </div>
            </div>

            {/* Wheel */}
            <div
                className={`relative ${isSpinning ? '' : 'transition-transform duration-100'}`}
                style={{
                    transform: `rotate(${rotation}deg)`,
                    width: size,
                    height: size,
                }}
            >
                {/* Outer glow effect */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        boxShadow: `
                            0 0 80px rgba(255, 165, 0, 0.4),
                            0 0 120px rgba(255, 165, 0, 0.2),
                            inset 0 0 60px rgba(0,0,0,0.3)
                        `
                    }}
                />

                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="rounded-full"
                />
            </div>

            <style jsx>{`
                @keyframes led-pulse {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes led-blink {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}


export default function WheelDisplayPage({ params }: { params: { id: string } }) {
    const eventId = params.id || 'default'
    // State
    const [prizes, setPrizes] = useState<Prize[]>([])
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
    })

    const [rotation, setRotation] = useState(0)
    const [isSpinning, setIsSpinning] = useState(false)
    const [winner, setWinner] = useState<Prize | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [viewState, setViewState] = useState<'welcome' | 'auth' | 'game'>('game')  // Default to game view

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [accessCode, setAccessCode] = useState<string | null>(null)
    const [participantName, setParticipantName] = useState<string | null>(null)
    const [isSpinningSecurely, setIsSpinningSecurely] = useState(false)

    const spinButtonRef = useRef<HTMLButtonElement>(null)

    // Audio Context
    const audioContextRef = useRef<AudioContext | null>(null)
    const lastProcessedTimestamp = useRef(0)
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext
                if (AudioContext) {
                    audioContextRef.current = new AudioContext()
                }
            }
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume()
            }
        }

        document.addEventListener('click', initAudio)
        document.addEventListener('keydown', initAudio)
        return () => {
            document.removeEventListener('click', initAudio)
            document.removeEventListener('keydown', initAudio)
        }
        return () => {
            document.removeEventListener('click', initAudio)
            document.removeEventListener('keydown', initAudio)
        }
    }, [])

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

    const playTickSound = useCallback(() => {
        if (!settings.enableSound || isMuted || !audioContextRef.current) return

        try {
            const ctx = audioContextRef.current
            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()

            osc.type = 'triangle'
            osc.frequency.setValueAtTime(800, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

            osc.connect(gainNode)
            gainNode.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.1)
        } catch (e) {
            console.error('Audio play error', e)
        }
    }, [settings.enableSound, isMuted])

    const playWinSound = useCallback(() => {
        if (!settings.enableSound || isMuted || !audioContextRef.current) return

        try {
            const ctx = audioContextRef.current
            const now = ctx.currentTime

            const notes = [523.25, 659.25, 783.99, 1046.50] // C E G C

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator()
                const gainNode = ctx.createGain()

                osc.type = 'sine'
                osc.frequency.setValueAtTime(freq, now + i * 0.1)

                gainNode.gain.setValueAtTime(0.2, now + i * 0.1)
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5)

                osc.connect(gainNode)
                gainNode.connect(ctx.destination)

                osc.start(now + i * 0.1)
                osc.stop(now + i * 0.1 + 0.5)
            })
        } catch (e) {
            console.error('Win sound error', e)
        }
    }, [settings.enableSound, isMuted])

    const playLossSound = useCallback(() => {
        if (!settings.enableSound || isMuted || !audioContextRef.current) return

        try {
            const ctx = audioContextRef.current
            const now = ctx.currentTime

            // Descending "Wah wah wah"
            const frequencies = [392.00, 369.99, 349.23, 293.66] // G4, F#4, F4, D4
            const durations = [0.3, 0.3, 0.3, 0.8]

            let startTime = now
            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()

                osc.type = 'triangle'
                osc.frequency.setValueAtTime(freq, startTime)
                // Slide down effect
                osc.frequency.linearRampToValueAtTime(freq - 10, startTime + durations[i])

                gain.gain.setValueAtTime(0.2, startTime)
                gain.gain.linearRampToValueAtTime(0.01, startTime + durations[i])

                osc.connect(gain)
                gain.connect(ctx.destination)

                osc.start(startTime)
                osc.stop(startTime + durations[i])

                startTime += durations[i]
            })

        } catch (e) {
            console.error('Loss sound error', e)
        }
    }, [settings.enableSound, isMuted])

    // Send callback to admin
    const sendCallback = useCallback((action: string, data: object = {}) => {
        localStorage.setItem('wheelCallback', JSON.stringify({
            action,
            data,
            timestamp: Date.now()
        }))
    }, [])

    // Process command
    const processCommand = useCallback((command: Command) => {
        if (command.timestamp <= lastProcessedTimestamp.current) return
        lastProcessedTimestamp.current = command.timestamp

        console.log('Processing command:', command.action)

        switch (command.action) {
            case 'UPDATE_DATA':
                if (command.data.settings) setSettings(command.data.settings)
                if (command.data.prizes) setPrizes(command.data.prizes.filter(p => p.isActive))
                break

            case 'START_SPIN':
                if (command.data.prizes) setPrizes(command.data.prizes.filter(p => p.isActive))
                if (command.data.settings) setSettings(command.data.settings)

                const activePrizes = command.data.prizes?.filter(p => p.isActive) || prizes
                const winnerId = command.data.winnerId
                const winnerPrize = activePrizes.find(p => p.id === winnerId)

                if (winnerPrize && activePrizes.length > 0) {
                    startSpin(activePrizes, winnerPrize, command.data.settings?.spinDuration || settings.spinDuration)
                }
                break

            case 'STOP_SPIN':
                setIsSpinning(false)
                setRotation(0)
                setWinner(null)
                setShowConfetti(false)
                break

            case 'PAUSE_SPIN':
                // Could implement pause logic
                break

            case 'RESUME_SPIN':
                // Could implement resume logic
                break
        }
    }, [prizes, settings])

    // Start spin animation
    const startSpin = (activePrizes: Prize[], winnerPrize: Prize, duration: number) => {
        // Resume audio context if needed
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume()
        }

        setIsSpinning(true)
        setWinner(null)
        setShowConfetti(false)

        // Calculate target rotation
        const winnerIndex = activePrizes.findIndex(p => p.id === winnerPrize.id)
        const sliceAngle = 360 / activePrizes.length

        // Random offset within 80% range of the slice to avoid boundaries
        const safeZone = 0.8
        const randomOffset = (Math.random() - 0.5) * (sliceAngle * safeZone)

        const targetSliceAngle = winnerIndex * sliceAngle + sliceAngle / 2 + randomOffset
        const extraRotations = 5 * 360 // 5 full rotations
        const finalRotation = extraRotations + (360 - targetSliceAngle)

        // Animate
        const startTime = Date.now()
        const startRotation = rotation % 360
        let lastTickRotation = startRotation

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3)

            const currentRotation = startRotation + eased * finalRotation
            setRotation(currentRotation)

            // Play tick sound based on slice passing top
            const diff = currentRotation - lastTickRotation
            if (diff >= sliceAngle) {
                playTickSound()
                lastTickRotation = currentRotation
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                // Spin complete
                setIsSpinning(false)
                setWinner(winnerPrize)
                setIsSpinningSecurely(false) // Unlock

                // Only show confetti for actual wins (not "Kazanamadınız")
                const isLoss = winnerPrize.name.toLowerCase().includes('kazanamadı')
                if (settings.enableConfetti && !isLoss) {
                    setShowConfetti(true)
                }

                // Play win sound only for actual wins
                if (!isLoss) {
                    playWinSound()
                } else {
                    playLossSound()
                }

                sendCallback('SPIN_FINISHED', { winner: winnerPrize })
            }
        }

        requestAnimationFrame(animate)
    }

    const handleSpin = async () => {
        if (isSpinning || isSpinningSecurely) return
        if (settings.enableAccessCodes && !accessCode) return

        setIsSpinningSecurely(true) // Lock UI

        try {
            const result = await spinWheel(eventId, accessCode || null, participantName || undefined)

            if (result.success && result.winner) {
                // Use server-returned winner directly to avoid ID mismatch issues
                const activePrizes = prizes.filter(p => p.isActive)

                // Create a compatible prize object from server response
                const serverWinner = {
                    ...result.winner,
                    probability: 1, // Not needed for display
                    stockQuantity: 1,
                    remainingStock: 1,
                    isActive: true,
                    displayOrder: 0
                } as any

                startSpin(activePrizes, serverWinner, settings.spinDuration)
            } else {
                alert(result.message || 'Çevirme hatası.')
                setIsSpinningSecurely(false)
            }
        } catch (e) {
            console.error(e)
            alert('Bir hata oluştu.')
            setIsSpinningSecurely(false)
        }
    }



    // Listen for commands
    useEffect(() => {
        const checkCommand = () => {
            const commandStr = localStorage.getItem('wheelCommand')
            if (commandStr) {
                try {
                    const command = JSON.parse(commandStr) as Command
                    processCommand(command)
                } catch (e) {
                    console.error('Command parse error', e)
                }
            }
        }

        // Initial check
        checkCommand()

        // Poll for commands
        const timer = setInterval(checkCommand, 100)
        return () => clearInterval(timer)
    }, [processCommand])

    // Keyboard support for Spin
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && spinButtonRef.current) {
                spinButtonRef.current.click()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Audio context initialization handled above

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Sound toggle moved to bottom-left */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-8 left-8 p-3 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors z-20"
            >
                {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-white" />}
            </button>

            {/* Logo */}
            {settings.logoUrl && (
                <div className="absolute top-8 right-8 z-20">
                    <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
                </div>
            )}

            {/* Left Sidebar - Mini QR & Info moved to top-left */}
            {settings.qrCodeUrl && (
                <div className="absolute top-8 left-8 flex flex-col items-start gap-4 z-20 animate-fade-in-down">
                    <div className="group relative p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/20">
                        <div className="bg-white p-2 rounded-xl">
                            <img src={settings.qrCodeUrl} alt="QR" className="w-24 h-24 md:w-32 md:h-32" />
                        </div>
                        <div className="mt-2 text-center">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">KATILIM KODU</span>
                            <div className="text-xl font-black text-amber-400 tracking-wider">
                                {settings.eventPin}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Vertical Layout */}
            <div className="flex flex-col items-center w-full max-w-5xl mx-auto relative z-10">

                {/* Top - Title and Wheel */}
                <div className="flex flex-col items-center">
                    {/* Title */}
                    <div className="text-center mb-4">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 mb-1 tracking-tight">
                            {settings.title}
                        </h1>
                        <p className="text-lg text-slate-400">{settings.subtitle}</p>
                    </div>

                    {/* Wheel */}
                    <div className="relative">
                        {prizes.length > 0 ? (
                            <WheelCanvas
                                prizes={prizes}
                                rotation={rotation}
                                isSpinning={isSpinning}
                            />
                        ) : (
                            <div className="w-[450px] h-[450px] rounded-full bg-slate-800/50 border-4 border-dashed border-slate-700 flex items-center justify-center">
                                <div className="text-center text-slate-500">
                                    <Gift size={64} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-xl">Hediye bekleniyor...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom - Prize List */}
                <div className="mt-6 bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 w-full max-w-3xl">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <Gift size={18} />
                            Hediyeler
                        </h2>
                        <p className="text-xs text-slate-500">
                            <span className="text-amber-400 font-bold">{prizes.filter(p => !p.name.toLowerCase().includes('kazanamadı')).length}</span> hediye sizi bekliyor!
                        </p>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {prizes.filter(p => !p.name.toLowerCase().includes('kazanamadı')).map((prize, idx) => (
                            <div
                                key={prize.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/30"
                            >
                                <div
                                    className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold shadow flex-shrink-0"
                                    style={{ backgroundColor: prize.color }}
                                >
                                    {idx + 1}
                                </div>
                                <p className="font-medium text-white text-xs truncate">{prize.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confetti */}
            <Confetti active={showConfetti} />

            {/* Win Modal */}
            <WinModal
                prize={winner}
                onClose={() => {
                    setWinner(null)
                    setShowConfetti(false)
                    // Reset to welcome screen to allow next participant
                    setViewState('welcome')

                    if (settings.enableAccessCodes) {
                        setIsAuthenticated(false)
                        setAccessCode(null)
                    }
                }}
            />


            {viewState === 'welcome' && (
                <WelcomeScreen
                    title={settings.title || 'Çarkı Çevir'}
                    subtitle={settings.subtitle || 'Şansını Dene, Hediyeni Kap!'}
                    qrCodeUrl={settings.qrCodeUrl}
                    eventPin={settings.eventPin}
                    onStart={() => {
                        // Check if auth is needed
                        if (settings.enableAccessCodes && !isAuthenticated) {
                            setViewState('auth')
                        } else {
                            setViewState('game')
                        }
                    }}
                />
            )}

            {viewState === 'auth' && (
                <AuthView
                    eventId={eventId}
                    settings={settings}
                    onBack={() => setViewState('welcome')}
                    onLogin={(code, name) => {
                        setAccessCode(code)
                        setParticipantName(name)
                        setIsAuthenticated(true)
                        setViewState('game')
                    }}
                />
            )}

            {/* Interactive Spin Button (All Modes) */}
            {viewState === 'game' && (!isSpinning && !winner) && (
                (!settings.enableAccessCodes || (settings.enableAccessCodes && isAuthenticated)) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30" style={{ marginTop: -15 }}>
                        <button
                            ref={spinButtonRef}
                            onClick={handleSpin}
                            disabled={isSpinningSecurely}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-orange-500/50 flex items-center justify-center text-white font-bold text-xl animate-pulse hover:scale-105 transition-all border-4 border-white/20 active:scale-95"
                        >
                            {isSpinningSecurely ? <Loader2 className="animate-spin" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>
                )
            )}

            {/* Overlay for non-interactive (Admin) mode - Optional */}

            <style jsx global>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce {
                    animation: bounce 0.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
