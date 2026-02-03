"use client";

import { Button } from "@ks-interaktif/ui";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
    return (
        <section id="contact" className="py-24 bg-black text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        <Sparkles className="text-yellow-400" size={18} />
                        <span className="text-sm font-bold tracking-wider uppercase">Siz de Aramıza Katılın</span>
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter leading-tight">
                        Etkinliklerin Geleceğini <br />
                        <span className="text-gradient">Birlikte İnşa Edelim</span>
                    </h2>

                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Saniyeler içinde kayıt olun, ilk etkinliğinizi ücretsiz oluşturun.
                        Kredi kartı gerekmez, gizli ücretler yok.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button className="h-20 px-12 text-2xl bg-red-600 text-white font-black rounded-3xl hover:bg-red-500 shadow-2xl shadow-red-600/40 transition-all hover:scale-105 border-0">
                            Ücretsiz Başla
                        </Button>
                        <button className="h-20 px-10 text-xl text-white font-bold flex items-center gap-3 hover:text-red-400 transition-colors group">
                            Demo Randevusu Al <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>

                    <div className="mt-20 flex items-center justify-center gap-12 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-2 italic">14 Gün Ücretsiz</div>
                        <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                        <div className="flex items-center gap-2 italic">Sınırsız Aktivite</div>
                        <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                        <div className="flex items-center gap-2 italic">Kurumsal Destek</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
