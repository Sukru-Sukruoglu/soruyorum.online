"use client";

import { MonitorSmartphone, Users, Zap, Palette, Globe, BarChart3, ChevronRight } from "lucide-react";

export function Features() {
    const features = [
        {
            icon: <MonitorSmartphone className="w-8 h-8" />,
            title: "Hibrit Etkinlik Gücü",
            description: "Katılımcılar ister kendi telefonlarından, ister KS Keypad cihazlarından saniyeler içinde bağlanabilirler.",
            color: "from-red-500 to-rose-600",
            light: "bg-red-500/10 text-red-600"
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: "Sınırsız Ölçeklenebilirlik",
            description: "20.000+ eşzamanlı katılımcıya kadar sorunsuz performans sağlayan bulut altyapısı.",
            color: "from-orange-500 to-red-600",
            light: "bg-orange-500/10 text-orange-600"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Sıfır Gecikme (Low Latency)",
            description: "Websocket teknolojimiz ile tüm sonuçlar ve liderlik tabloları anında senkronize olur.",
            color: "from-yellow-400 to-orange-500",
            light: "bg-yellow-400/10 text-yellow-600"
        },
        {
            icon: <Palette className="w-8 h-8" />,
            title: "Tam Kurumsal Kimlik",
            description: "Logonuz, fontlarınız ve renklerinizle platformu tamamen kendi markanıza dönüştürün.",
            color: "from-rose-500 to-pink-600",
            light: "bg-rose-500/10 text-rose-600"
        },
        {
            icon: <Globe className="w-8 h-8" />,
            title: "Global Erişilebilirlik",
            description: "10+ dil desteği ve dünyanın her yerinden erişim imkanı ile sınırları ortadan kaldırın.",
            color: "from-red-400 to-orange-500",
            light: "bg-red-400/10 text-red-500"
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "Derinlemesine Analiz",
            description: "Detaylı katılımcı raporları, başarı oranları ve Excel dökümleriyle veriye hükmedin.",
            color: "from-gray-600 to-gray-800",
            light: "bg-gray-600/10 text-gray-700"
        }
    ];

    return (
        <section id="features" className="py-32 bg-white relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-red-50 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">
                        Profesyoneller İçin <br />
                        <span className="text-red-600">Eksiksiz Özellikler</span>
                    </h2>
                    <p className="text-xl text-gray-500 leading-relaxed">
                        Sıradan sunumları unutun. KS İnteraktif ile kitlenizin ilgisini her an canlı tutun.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-1 rounded-[2.5rem] bg-gray-50 hover:bg-gradient-to-br transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10"
                            style={{ backgroundImage: 'linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))' }}
                        >
                            <div className="bg-white p-10 rounded-[2.3rem] h-full border border-gray-100 group-hover:border-transparent transition-all">
                                <div className={`w-16 h-16 rounded-2xl ${feature.light} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 tracking-tight">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed mb-8">
                                    {feature.description}
                                </p>
                                <div className="flex items-center gap-2 text-red-600 font-bold text-sm cursor-pointer group-hover:gap-3 transition-all">
                                    Daha Fazla Bilgi <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
