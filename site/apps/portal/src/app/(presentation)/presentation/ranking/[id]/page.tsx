"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Star } from 'lucide-react'

// Types (should match Admin)
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

const ConfettiInfo = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) return null

    // Simple CSS implementation of confetti using fixed particles
    const particles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        color: ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'][Math.floor(Math.random() * 6)]
    }))

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: '-10px',
                        backgroundColor: p.color,
                        animation: `confetti-fall 3s linear ${p.delay}s infinite`
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(720deg); }
                }
            `}</style>
        </div>
    )
}

export default function DisplayPage({ params }: { params: { id: string } }) {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [settings, setSettings] = useState<CompetitionSettings>({
        title: 'BEKLEYİNİZ...',
        subtitle: '',
        layout: 'horizontal',
        animationSpeed: 400,
        logoUrl: null,
        logoPosition: 'top-right',
        logoSize: 100,
        backgroundType: 'gradient',
        customBackgroundUrl: null,
        audioUrl: null,
        audioEnabled: false
    })

    const [counter, setCounter] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isPausedRef = useRef(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Command Listener
    useEffect(() => {
        const checkCommands = () => {
            const commandStr = localStorage.getItem('competitionCommand')
            if (commandStr) {
                try {
                    const command = JSON.parse(commandStr)
                    // Basic debounce/check timestamp if needed, but simple removal works for 1-to-1

                    switch (command.action) {
                        case 'START_ANIMATION':
                            setParticipants(command.data.participants.map((p: any) => ({ ...p, displayScore: 0, isFinished: false })))
                            setSettings(command.data.settings)
                            startAnimation(command.data.participants, command.data.settings.animationSpeed)
                            setShowConfetti(false)
                            break
                        case 'UPDATE_SETTINGS':
                            setSettings(command.data.settings)
                            // Only update participants if not animating to avoid glitches, or careful merge
                            if (!timerRef.current) {
                                setParticipants(command.data.participants)
                            }
                            break
                        case 'STOP_ANIMATION':
                            stopAnimation()
                            break
                        case 'PAUSE_ANIMATION':
                            isPausedRef.current = true
                            if (audioRef.current) audioRef.current.pause()
                            break
                        case 'RESUME_ANIMATION':
                            isPausedRef.current = false
                            if (audioRef.current && settings.audioEnabled) audioRef.current.play()
                            break
                    }
                } catch (e) {
                    console.error(e)
                }
                localStorage.removeItem('competitionCommand')
            }
        }

        const interval = setInterval(checkCommands, 200)
        return () => clearInterval(interval)
    }, [settings.audioEnabled]) // Re-bind if needed

    // Animation Logic
    const startAnimation = (initialParticipants: Participant[], speedFactor: number) => {
        if (timerRef.current) clearInterval(timerRef.current)
        isPausedRef.current = false
        let currentCount = 0
        setCounter(0)

        // Play Audio
        if (settings.audioEnabled && settings.audioUrl && audioRef.current) {
            audioRef.current.src = settings.audioUrl
            audioRef.current.play().catch(e => console.log("Audio play failed", e))
        }

        const maxScore = Math.max(...initialParticipants.map(p => p.targetScore))
        const INTERVAL_MS = 20

        // Duration-based animation logic
        // speedFactor (from slider) is roughly mapped to total duration
        // e.g. 100 -> 5000ms (5s), 400 -> 20000ms (20s)
        const durationMs = speedFactor * 50
        const totalTicks = durationMs / INTERVAL_MS

        // Calculate increment per tick to complete in desired duration
        // Ensure minimum increment to avoid infinite loop on huge durations
        const safeMaxScore = maxScore > 0 ? maxScore : 100
        const increment = Math.max(0.01, safeMaxScore / totalTicks)

        timerRef.current = setInterval(() => {
            if (isPausedRef.current) return

            currentCount += increment
            setCounter(currentCount)

            setParticipants(prev => {
                // Update scores
                const nextState = prev.map(p => ({
                    ...p,
                    displayScore: Math.min(currentCount, p.targetScore),
                    isFinished: currentCount >= p.targetScore
                }))

                // Sort by displayScore descending
                return nextState.sort((a, b) => b.displayScore - a.displayScore)
            })

            if (currentCount >= maxScore) {
                // Ensure everyone is exactly at target before stopping
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    displayScore: p.targetScore,
                    isFinished: true
                })))
                stopAnimation(true)
            }
        }, INTERVAL_MS)
    }

    const stopAnimation = (finished = false) => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }

        if (finished) {
            setShowConfetti(true)
            localStorage.setItem('displayCallback', JSON.stringify({
                action: 'ANIMATION_FINISHED',
                timestamp: Date.now()
            }))
        }
    }

    // Visuals
    const getBackgroundStyle = () => {
        if (settings.backgroundType === 'image' && settings.customBackgroundUrl) {
            return { backgroundImage: `url(${settings.customBackgroundUrl})`, backgroundSize: 'cover' }
        }
        return {} // Default classes used
    }

    const getLogoStyle = () => {
        switch (settings.logoPosition) {
            case 'top-left': return { top: 20, left: 20 }
            case 'top-right': return { top: 20, right: 20 }
            case 'bottom-left': return { bottom: 20, left: 20 }
            case 'bottom-right': return { bottom: 20, right: 20 }
            default: return { top: 20, right: 20 }
        }
    }

    return (
        <div
            className={`min-h-screen overflow-hidden text-white relative transition-colors duration-1000 ${settings.backgroundType === 'gradient' ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-slate-900'}`}
            style={getBackgroundStyle()}
        >
            {/* Audio Element */}
            <audio ref={audioRef} loop />

            {/* Floating Particles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white/5 rounded-full blur-xl"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * -100 + "%"],
                            x: [null, Math.random() * 10 + "%"]
                        }}
                        transition={{
                            duration: Math.random() * 20 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: Math.random() * 300 + 50 + "px",
                            height: Math.random() * 300 + 50 + "px",
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-10 text-center pt-8 pb-4">
                <motion.h1
                    className="text-5xl font-black tracking-tight text-white drop-shadow-lg"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {settings.title}
                </motion.h1>
                {settings.subtitle && (
                    <motion.p
                        className="text-2xl text-indigo-300 mt-2 font-light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {settings.subtitle}
                    </motion.p>
                )}
            </header>

            {/* Logo */}
            {settings.logoUrl && (
                <motion.div
                    className="absolute z-20"
                    style={{
                        ...getLogoStyle(),
                        width: settings.logoSize || 100
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-auto drop-shadow-2xl" />
                </motion.div>
            )}

            {/* Main Content */}
            <main className="relative z-10 p-8 h-[calc(100vh-150px)] flex items-center justify-center">
                <div className={`w-full max-w-7xl mx-auto ${settings.layout === 'vertical' ? 'flex items-end justify-center gap-4 h-full' : 'flex flex-col gap-3 w-full'}`}>
                    <AnimatePresence>
                        {participants.map((p, index) => {
                            const rank = index + 1
                            const isTop3 = rank <= 3

                            if (settings.layout === 'vertical') {
                                // Vertical Bar Chart Style
                                const heightPercent = (p.displayScore / (Math.max(...participants.map(part => part.targetScore), 100))) * 100

                                return (
                                    <motion.div
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="relative flex flex-col items-center justify-end w-24 group"
                                        style={{ height: '80%' }}
                                    >
                                        {/* Score Bubble */}
                                        <motion.div
                                            className="mb-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1 font-bold text-2xl"
                                            animate={{
                                                scale: p.isFinished ? [1, 1.2, 1] : 1,
                                                borderColor: isTop3 ? p.color : 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            {Math.floor(p.displayScore)}
                                        </motion.div>

                                        {/* Bar */}
                                        <motion.div
                                            className="w-full rounded-t-2xl relative shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                                            style={{
                                                backgroundColor: p.color,
                                                height: `${Math.max(heightPercent, 5)}%`, // Min height
                                                boxShadow: `0 0 20px ${p.color}40` // Glow
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-t-2xl" />

                                            {/* Avatar inside bar bottom */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden bg-slate-800">
                                                {p.avatar ? (
                                                    <img src={p.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">{p.name.charAt(0)}</div>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Name */}
                                        <div className="mt-4 text-center">
                                            <p className="font-bold text-lg truncate w-full text-shadow-sm">{p.name}</p>
                                        </div>

                                        {/* Rank Badge */}
                                        {isTop3 && (
                                            <div className="absolute -top-12">
                                                {rank === 1 && <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                                                {rank === 2 && <Medal className="w-7 h-7 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]" />}
                                                {rank === 3 && <Medal className="w-6 h-6 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />}
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            } else {
                                // Horizontal List Style
                                return (
                                    <motion.div
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className={`relative flex items-center gap-4 p-3 rounded-2xl border ${isTop3 ? 'bg-white/10 border-white/20' : 'bg-slate-800/40 border-slate-700/40'} backdrop-blur-sm`}
                                    >
                                        {/* Rank */}
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl shadow-inner ${rank === 1 ? 'bg-yellow-500/80 text-white' :
                                            rank === 2 ? 'bg-gray-400/80 text-white' :
                                                rank === 3 ? 'bg-orange-500/80 text-white' :
                                                    'bg-slate-700/50 text-slate-400'
                                            }`}>
                                            {rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden bg-slate-800 flex-shrink-0">
                                            {p.avatar ? (
                                                <img src={p.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{p.name.charAt(0)}</div>
                                            )}
                                        </div>

                                        {/* Bar Area */}
                                        <div className="flex-1 relative h-10 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                className="h-full relative"
                                                style={{ backgroundColor: p.color, width: `${(p.displayScore / Math.max(...participants.map(_ => _.targetScore))) * 100}%` }}
                                                layout
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-white/20" />
                                                {/* Sparkle effect on bar end */}
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                                            </motion.div>

                                            {/* Name overlay */}
                                            <div className="absolute inset-0 flex items-center px-4 justify-between">
                                                <span className="font-bold text-shadow-sm z-10">{p.name}</span>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="w-24 text-right">
                                            <motion.span
                                                className={`font-mono text-3xl font-bold ${p.isFinished ? 'text-green-400' : 'text-white'}`}
                                                key={p.displayScore} // Trigger pop animation?
                                            >
                                                {Math.floor(p.displayScore)}
                                            </motion.span>
                                        </div>
                                    </motion.div>
                                )
                            }
                        })}
                    </AnimatePresence>
                </div>
            </main>

            {/* Confetti Overlay */}
            <ConfettiInfo isActive={showConfetti} />
        </div>
    )
}
