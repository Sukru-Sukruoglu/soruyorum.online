"use client";

import { Star } from "lucide-react";

export function Testimonials() {
    const testimonials = [
        {
            quote: "KS İnteraktif sayesinde şirket içi eğitimlerimiz %85 daha fazla katılım almaya başladı. Oyunlaştırma gerçekten işe yarıyor!",
            name: "Ahmet Yılmaz",
            role: "İK Müdürü @ TechCorp",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet"
        },
        {
            quote: "Global zirvelerimizde binlerce katılımcıyı aynı anda yönetmek hiç bu kadar kolay olmamıştı. Teknik ekip ve platform kusursuz.",
            name: "Ayşe Demir",
            role: "Kreatif Direktör",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse"
        },
        {
            quote: "Hem fiziksel butonlar hem de mobil katılım özelliği hibrit etkinliklerimiz için aradığımız mükemmel çözümdü.",
            name: "Mehmet Kaya",
            role: "Etkinlik Operasyon Başkanı",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet"
        }
    ];

    return (
        <section id="testimonials" className="py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest mb-4">
                        Gerçek Deneyimler
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">
                        Müşterilerimizden <br />
                        <span className="text-red-600">Tam Not</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {testimonials.map((item, i) => (
                        <div key={i} className="bg-gray-50 p-10 rounded-[2.5rem] relative group border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                            <div className="flex gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />)}
                            </div>
                            <p className="text-gray-600 font-medium italic mb-8 relative z-10 leading-relaxed text-lg">
                                "{item.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="p-1 rounded-full bg-gradient-to-tr from-red-600 to-rose-600">
                                    <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full border-2 border-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 tracking-tight">{item.name}</h4>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider text-[10px]">{item.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
