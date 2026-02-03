"use client";

import { Button } from "@ks-interaktif/ui";
import { ArrowRight, HelpCircle, BarChart, Cloud, Target, RotateCw, Trophy, MessageCircle } from "lucide-react";

export function GamesShowcase() {
    const games = [
        {
            title: "Quiz / Bilgi Yarışması",
            desc: "Klasik ve tempolu bilgi yarışmaları",
            color: "from-red-600 to-rose-600",
            icon: <HelpCircle size={32} />
        },
        {
            title: "Canlı Oylama",
            desc: "Anlık geribildirim ve oylama",
            color: "from-purple-600 to-pink-600",
            icon: <BarChart size={32} />
        },
        {
            title: "Kelime Bulutu",
            desc: "Katılımcı fikirlerinden görsel sanat",
            color: "from-orange-500 to-yellow-600",
            icon: <Cloud size={32} />
        },
        {
            title: "Soru Gönder",
            desc: "İnteraktif Q&A oturumları",
            color: "from-cyan-500 to-blue-600",
            icon: <MessageCircle size={32} />
        },
        {
            title: "Şans Çarkı",
            desc: "Heyecan dolu çekilişler",
            color: "from-emerald-500 to-teal-600",
            icon: <RotateCw size={32} />
        },
        {
            title: "Takım Mücadelesi",
            desc: "Gruplar arası kıyasıya rekabet",
            color: "from-blue-500 to-cyan-600",
            icon: <Trophy size={32} />
        },
        {
            title: "Hızlı Parmaklar",
            desc: "En hızlı cevap veren kazanır",
            color: "from-rose-500 to-orange-500",
            icon: <Target size={32} />
        }
    ];

    return (
        <section id="software" className="py-32 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest mb-4">
                            İnteraktif Kütüphane
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                            Sıkıcı Sunumlara <br />
                            <span className="text-red-600">Veda Edin</span>
                        </h2>
                        <p className="text-xl text-gray-500 leading-relaxed font-medium">
                            Her amaca uygun 15'ten fazla aktivite tipiyle etkinliğinizi kişiselleştirin.
                        </p>
                    </div>
                    <Button className="hidden md:flex gap-2 rounded-full px-8 h-14 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm transition-all font-bold">
                        Tümünü Keşfet <ArrowRight size={18} />
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {games.map((game, index) => (
                        <div
                            key={index}
                            className="group relative h-80 rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} transition-all duration-500 group-hover:scale-110`}></div>

                            {/* Overlay Pattern */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center text-white z-10">
                                <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/20 transform group-hover:rotate-12 transition-transform duration-500">
                                    {game.icon}
                                </div>
                                <h3 className="text-xl font-black mb-3 leading-tight">{game.title}</h3>
                                <div className="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    <p className="text-sm text-white/80 font-medium">
                                        {game.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Bottom Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Button className="w-full gap-2 h-14 rounded-2xl bg-white text-gray-900 border border-gray-200">
                        Tüm Oyunları Gör <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </section>
    );
}
