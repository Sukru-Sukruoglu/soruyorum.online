"use client";

import { MonitorSmartphone, Timer } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden text-white font-sans selection:bg-red-500/30">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/40 rounded-full blur-[128px] animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-700/30 rounded-full blur-[128px] animate-blob animation-delay-2000 mix-blend-screen"></div>
                <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-rose-900/30 rounded-full blur-[128px] animate-blob animation-delay-4000 mix-blend-screen"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="mb-10 flex justify-center animate-in zoom-in duration-1000 slide-in-from-bottom-5">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-2xl shadow-red-900/40 animate-float">
                        <MonitorSmartphone size={48} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    KS İnteraktif
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    Etkinlik deneyimini yeniden tanımlıyoruz.<br />
                    <span className="text-red-500 font-medium">Yeni yüzümüzle çok yakında yayındayız.</span>
                </p>

                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-in fade-in zoom-in duration-1000 delay-500 hover:bg-white/10 transition-colors cursor-default">
                    <Timer className="text-red-500 animate-pulse" />
                    <span className="font-mono text-lg text-gray-300">Yapım Aşamasında</span>
                </div>

                {/* Hidden Access Link for Testing */}
                <div className="fixed bottom-5 right-5 opacity-0 hover:opacity-100 transition-opacity duration-500 delay-1000">
                    <Link href="http://localhost:3001/login" className="text-xs text-gray-700 hover:text-white font-mono">Portal Girişi</Link>
                </div>
            </div>
        </div>
    );
}
