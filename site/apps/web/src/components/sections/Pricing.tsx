"use client";

import { Button } from "@ks-interaktif/ui";
import { Check, Star, Zap, Building2 } from "lucide-react";

export function Pricing() {
    return (
        <section id="pricing" className="py-32 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-600 text-[10px] font-black uppercase tracking-widest mb-4">
                        Esnek Paketler
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">
                        İhtiyacınıza Uygun <br />
                        <span className="text-indigo-600">Basit Çözümler</span>
                    </h2>
                    <p className="text-xl text-gray-500 font-medium leading-relaxed">
                        Her ölçekteki organizasyon için şeffaf ve sürprizsiz fiyatlandırma.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-10">
                    {/* Free Plan */}
                    <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-500">
                        <div className="mb-8">
                            <span className="p-3 bg-white rounded-2xl inline-block mb-6 shadow-sm">
                                <Zap className="text-gray-400" size={24} />
                            </span>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Başlangıç</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-5xl font-black tracking-tight text-gray-900">₺0</span>
                                <span className="text-gray-500 font-bold">/ay</span>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Küçük gruplar ve denemeler için tamamen ücretsiz.</p>
                        </div>
                        <Button className="w-full h-14 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 font-bold hover:bg-gray-50 mb-10">
                            Ücretsiz Dene
                        </Button>
                        <ul className="space-y-4 flex-1">
                            {[
                                "25 Katılımcıya kadar",
                                "Ayda 3 Etkinlik",
                                "Temel Quiz & Anketler",
                                "Topluluk Desteği"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <Check className="text-green-500 shrink-0" size={18} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro Plan (Popular) */}
                    <div className="bg-black rounded-[2.5rem] p-10 border-4 border-red-600/30 shadow-2xl relative flex flex-col transform lg:-translate-y-8">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                            En Çok Tercih Edilen
                        </div>
                        <div className="mb-8">
                            <span className="p-3 bg-red-500/10 rounded-2xl inline-block mb-6 shadow-sm border border-red-500/20">
                                <Star className="text-yellow-400 fill-yellow-400" size={24} />
                            </span>
                            <h3 className="text-2xl font-black text-white mb-2">Pro Paket</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-5xl font-black tracking-tight text-red-500">₺299</span>
                                <span className="text-gray-400 font-bold">/ay</span>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Büyüyen ekipler ve kurumsal etkinlikler için.</p>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-600/30 mb-10 border-0">
                            Hemen Başla
                        </Button>
                        <ul className="space-y-4 flex-1">
                            {[
                                "500 Katılımcıya kadar",
                                "Sınırsız Etkinlik",
                                "Tüm Oyun Modları + AI",
                                "Markanıza Özel Tema",
                                "Detaylı Raporlama",
                                "Öncelikli Destek"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-red-100">
                                    <Check className="text-red-500 shrink-0" size={18} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-500">
                        <div className="mb-8">
                            <span className="p-3 bg-white rounded-2xl inline-block mb-6 shadow-sm">
                                <Building2 className="text-gray-400" size={24} />
                            </span>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Kurumsal</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-black tracking-tight text-gray-900">Özel Fiyat</span>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Dev organizasyonlar ve özel entegrasyonlar.</p>
                        </div>
                        <Button className="w-full h-14 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 font-bold hover:bg-gray-50 mb-10">
                            Bize Ulaşın
                        </Button>
                        <ul className="space-y-4 flex-1">
                            {[
                                "20.000+ Katılımcı",
                                "Özel Domain & SSO",
                                "White Label Çözümler",
                                "Hizmet Seviyesi Garantisi (SLA)",
                                "7/24 Özel Müşteri Temsilcisi",
                                "Dedicated Sunucu Seçeneği"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <Check className="text-green-500 shrink-0" size={18} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
