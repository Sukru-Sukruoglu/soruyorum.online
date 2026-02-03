"use client";

import { Cpu, Wifi, Battery, Shield } from "lucide-react";

export function Hardware() {
    return (
        <section id="hardware" className="py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
                        Güçlü <span className="text-red-600">Donanım</span> Altyapısı
                    </h2>
                    <p className="text-xl text-gray-500 font-medium">
                        Kendi üretimimiz olan patentli keypad cihazları ve gelişmiş alıcı istasyonları ile kesintisiz iletişim.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            icon: <Cpu className="w-8 h-8" />,
                            title: "Yüksek Performans",
                            desc: "Saniyede 1000+ oy işleme kapasitesi"
                        },
                        {
                            icon: <Wifi className="w-8 h-8" />,
                            title: "Gelişmiş RF",
                            desc: "400 metre çekim alanı ve parazit önleme"
                        },
                        {
                            icon: <Battery className="w-8 h-8" />,
                            title: "Uzun Pil Ömrü",
                            desc: "Tek şarjla 1 yıl bekleme süresi"
                        },
                        {
                            icon: <Shield className="w-8 h-8" />,
                            title: "Dayanıklı Tasarım",
                            desc: "Düşmelere ve sıvı temasına dayanıklı"
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
