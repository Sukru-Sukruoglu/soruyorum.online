"use client";

import { Button } from "@ks-interaktif/ui";
import { Play, Zap, Users, Trophy, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Hero() {
    const [pin, setPin] = useState("");

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length >= 4) {
            window.location.href = `http://localhost:3002/?pin=${pin}`;
        }
    };

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-black text-white pt-20">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-900/30 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-800/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Text Content */}
                <div className="text-center lg:text-left space-y-10">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/20 animate-fade-in">
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
                            YENİ NESİL
                        </span>
                        <span className="text-sm font-medium text-red-200">İnteraktif Etkinlik Platformu 🚀</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
                            Etkinliklerinizi <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">
                                Deneyime Dönüştürün
                            </span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Canlı yarışmalar, anlık oylamalar ve heyecan dolu aktivitelerle kitlenizi büyüleyin.
                            <span className="text-white"> Saniyeler içinde bağlanın, eğlenceyi başlatın.</span>
                        </p>
                    </div>

                    {/* Quick Join BOX */}
                    <div className="max-w-md mx-auto lg:mx-0 p-1 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 shadow-2xl shadow-red-600/20">
                        <form onSubmit={handleJoin} className="bg-black/90 rounded-[22px] p-6 flex flex-col sm:flex-row gap-3 relative overflow-hidden group">
                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="relative flex-1">
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="PIN Kodunu Girin"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-gray-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold gap-2 text-lg shrink-0 group shadow-lg shadow-red-600/30 border-0 transition-transform active:scale-95"
                            >
                                Hemen Katıl
                                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </Button>
                        </form>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                        <Link href="https://soruyorum.online/register">
                            <button className="text-white hover:text-red-400 font-bold flex items-center gap-2 transition-colors group">
                                <span className="bg-red-600/20 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <Users size={20} />
                                </span>
                                Organizatör Olarak Başla
                            </button>
                        </Link>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden sm:block"></div>
                        <button className="text-gray-400 hover:text-white font-medium flex items-center gap-2 transition-colors">
                            <Play size={20} /> Demo İzle
                        </button>
                    </div>
                </div>

                {/* Visual Content - Floating Mockup */}
                <div className="relative hidden lg:block perspective-1000">
                    <div className="animate-float">
                        {/* Glass Card */}
                        <div className="glass-morphism rounded-[2.5rem] p-8 relative overflow-hidden group border-red-500/20 bg-black/40">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent"></div>

                            {/* Live Badge */}
                            <div className="absolute top-8 right-8 flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-xs font-bold uppercase tracking-widest">Canlı</span>
                            </div>

                            {/* UI Mockup Content */}
                            <div className="relative z-10 space-y-8 mt-4">
                                <div className="space-y-2">
                                    <p className="text-red-500 font-bold text-sm tracking-widest uppercase">Quiz Aktivitesi</p>
                                    <h3 className="text-3xl font-black leading-tight text-white">Günün En Hızlısı <br />Kim Olacak?</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Soru', val: '08/15', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                        { label: 'Süre', val: '12s', icon: Play, color: 'text-red-400', bg: 'bg-red-500/10' },
                                        { label: 'Katılımcı', val: '2.4k', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
                                        { label: 'Ödül', val: '🏆', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                                <stat.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                                                <p className="text-lg font-black">{stat.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Answers Preview */}
                                <div className="space-y-3">
                                    <div className="w-full h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 justify-between group-hover:border-red-500/30 transition-colors">
                                        <span className="text-sm font-medium">A) Merkür</span>
                                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="w-[30%] h-full bg-red-500"></div>
                                        </div>
                                    </div>
                                    <div className="w-full h-12 bg-red-500/20 rounded-xl border border-red-500/50 flex items-center px-4 justify-between shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                        <span className="text-sm font-bold text-red-100">B) Jüpiter</span>
                                        <div className="w-20 h-2 bg-red-500/30 rounded-full overflow-hidden">
                                            <div className="w-[85%] h-full bg-red-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decoration Elements */}
                        <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600 rounded-3xl blur-[80px] opacity-40 animate-pulse"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600 rounded-full blur-[80px] opacity-30 animate-pulse delay-500"></div>

                        {/* Floating Badges */}
                        <div className="absolute -right-8 top-1/2 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl animate-float delay-700">
                            <p className="text-[10px] text-red-300 font-bold uppercase mb-2">Liderlik Tablosu</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] flex items-center justify-center font-bold">1</div>
                                    <span className="text-xs font-bold text-gray-200">Ayşe Y.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-500/20 text-gray-400 text-[10px] flex items-center justify-center font-bold">2</div>
                                    <span className="text-xs font-bold text-gray-400">Mehmet K.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
