"use client";

import { X, Sparkles, PenTool, LayoutTemplate, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectScratch: () => void;
    onSelectTemplate: () => void;
}

export function CreateEventModal({ isOpen, onClose, onSelectScratch, onSelectTemplate }: CreateEventModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gradient-to-br from-black/90 to-red-900/40 backdrop-blur-lg"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-5xl bg-gradient-to-b from-brand-dark-gray to-black border border-brand-primary/20 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.3)] overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-black/50 hover:bg-brand-primary text-gray-400 hover:text-white transition-colors border border-white/10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-12">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent inline-block pb-2">
                                    Yeni Etkinlik Oluştur
                                </h2>
                                <div className="h-1 w-24 bg-red-600 rounded-full mx-auto" />
                                <p className="text-gray-400 text-lg mt-4 font-light">
                                    Başlamak için bir yöntem seçin
                                </p>
                            </div>

                            {/* Cards Container */}
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Left Card - Scratch */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    onClick={onSelectScratch}
                                    className="group flex-1 relative min-h-[400px] rounded-2xl bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border-2 border-transparent hover:border-brand-primary transition-all duration-300 cursor-pointer overflow-hidden p-8 flex flex-col items-center justify-center text-center"
                                >
                                    {/* PRO Badge */}
                                    <div className="absolute top-0 right-0 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                        PRO
                                    </div>

                                    {/* Icon Area */}
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-900/50 to-black border-4 border-brand-primary/30 group-hover:border-brand-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 rounded-full animate-pulse bg-red-600/20 blur-xl"></div>
                                        <PenTool size={48} className="text-white relative z-10" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-red-400 transition-colors">
                                        Sıfırdan Başla
                                    </h3>

                                    <p className="text-gray-400 leading-relaxed max-w-xs mb-8">
                                        Hayal gücünü serbest bırak, tamamen özgün bir etkinlik kurgula.
                                    </p>

                                    <div className="flex gap-4 text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-brand-primary" /> Tam Özgürlük</span>
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-brand-primary" /> Özel Tasarım</span>
                                    </div>

                                    {/* Hover Vignette */}
                                    <div className="absolute inset-0 bg-radial-vignette opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                </motion.div>

                                {/* Right Card - Template */}
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    onClick={onSelectTemplate}
                                    className="group flex-1 relative min-h-[400px] rounded-2xl bg-gradient-to-b from-brand-dark-gray to-brand-mid-gray border-2 border-transparent hover:border-red-400 transition-all duration-300 cursor-pointer overflow-hidden p-8 flex flex-col items-center justify-center text-center"
                                >
                                    {/* Recommended Badge */}
                                    <div className="absolute top-0 left-0 bg-black/80 border border-brand-primary text-brand-primary text-xs font-bold px-3 py-1 rounded-br-xl">
                                        ÖNERİLEN
                                    </div>

                                    {/* Icon Area */}
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-bl from-black to-red-900 border-4 border-red-500/30 group-hover:border-red-400 group-hover:rotate-12 transition-all duration-500 flex items-center justify-center mb-8">
                                        <LayoutTemplate size={48} className="text-white" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-red-400 transition-colors">
                                        Şablon Seç
                                    </h3>

                                    <p className="text-gray-400 leading-relaxed max-w-xs mb-8">
                                        Hazır kurgulanmış profesyonel şablonlarla dakikalar içinde yayına geç.
                                    </p>

                                    <div className="flex gap-4 text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-brand-primary" /> Hızlı Kurulum</span>
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-brand-primary" /> Test Edilmiş</span>
                                    </div>

                                    {/* Button */}
                                    <div className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 absolute bottom-8">
                                        <span className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-full text-white text-sm font-semibold shadow-lg shadow-red-600/20">
                                            Şablonları İncele
                                        </span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
