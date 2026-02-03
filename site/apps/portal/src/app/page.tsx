import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "SoruYorum.Online — Etkileşimli Sunumlarınızın Güçlü Ortağı",
    description:
        "Canlı etkinlikler, konferanslar ve eğitimler için profesyonel soru-cevap platformu. Katılımcılarınızla anında bağlantı kurun.",
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white/95 font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/85 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 font-extrabold text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                                <path
                                    d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z"
                                    stroke="white"
                                    strokeWidth="1.6"
                                />
                                <path
                                    d="M8.2 10.4C8.6 8.5 10.2 7.2 12.2 7.2C14.6 7.2 16.1 8.7 16.1 10.6C16.1 12.6 14.4 13.4 13.3 14.1C12.6 14.6 12.4 14.9 12.4 16"
                                    stroke="white"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                                <circle cx="12.4" cy="18.5" r="1" fill="white" />
                            </svg>
                        </div>
                        SoruYorum
                    </Link>
                    <div className="flex items-center gap-2">
                        <a href="#features" className="hidden md:block px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">
                            Özellikler
                        </a>
                        <a href="#how" className="hidden md:block px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">
                            Nasıl Çalışır
                        </a>
                        <Link href="/login" className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">
                            Giriş Yap
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
                        >
                            Ücretsiz Başla
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="min-h-screen flex items-center justify-center pt-28 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-52 -right-24 w-[600px] h-[600px] rounded-full bg-red-500/30 blur-[120px] animate-pulse" />
                    <div className="absolute -bottom-40 -left-24 w-[500px] h-[500px] rounded-full bg-rose-700/30 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
                </div>
                <div className="max-w-4xl text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
                        Etkileşimli Sunumlarınızın
                        <br />
                        <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            Güçlü Ortağı
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
                        Canlı etkinlikler, konferanslar ve eğitimler için profesyonel soru-cevap platformu.
                        Katılımcılarınızla anında bağlantı kurun, soruları yönetin ve canlı ekranda görüntüleyin.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
                        >
                            Hemen Başlayın
                        </Link>
                        <Link
                            href="/join"
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-base font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            Sunuma Katıl
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6 bg-[#0a0a0a]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                            Neden SoruYorum.Online?
                        </h2>
                        <p className="text-lg text-white/60 max-w-xl mx-auto">
                            Modern etkinlikleriniz için ihtiyacınız olan tüm özellikler tek platformda
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard emoji="💬" title="Gerçek Zamanlı Soru-Cevap" desc="Katılımcılar QR kod okutarak veya sunum kodunu girerek anında katılabilir. Sorular gerçek zamanlı olarak sisteme ulaşır." />
                        <FeatureCard emoji="👥" title="Canlı Katılımcı Yönetimi" desc="Gerçek zamanlı katılımcı sayısı takibi, anonim katılım desteği ve çoklu katılım kontrolü." />
                        <FeatureCard emoji="📺" title="Canlı Soru Ekranı" desc="Onaylanan soruları modern ve şık ekran tasarımı ile görüntüleyin. Canlı istatistikler ve otomatik soru döngüsü." />
                        <FeatureCard emoji="✅" title="Gelişmiş Moderasyon" desc="Soruları tek tıkla onaylama/reddetme, soru geri alma özelliği ve canlı katılımcı listesi ile tam kontrol." />
                        <FeatureCard emoji="📱" title="Mobil Uyumlu" desc="Tüm cihazlarda sorunsuz çalışır. Responsive arayüz ve touch-friendly kontroller." />
                        <FeatureCard emoji="🔐" title="Güvenli ve Güvenilir" desc="KVKK uyumlu veri işleme, güvenli veritabanı yapısı ve rate limiting koruması." />
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how" className="py-24 px-6 bg-black">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Nasıl Çalışır?</h2>
                        <p className="text-lg text-white/60">3 basit adımda etkileşimli sunumlarınıza başlayın</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <Step num="1" title="Sunum Oluştur" desc="Hesabınıza giriş yapın, yeni sunum oluşturun ve sunum kodunu alın." />
                        <Step num="2" title="QR Kod Paylaş" desc="QR kodunu ekranda gösterin veya sunum kodunu katılımcılarla paylaşın." />
                        <Step num="3" title="Soruları Yönet" desc="Gelen soruları moderasyon panelinden yönetin ve canlı ekranda görüntüleyin." />
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-24 px-6 bg-[#0a0a0a]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Kullanım Alanları</h2>
                        <p className="text-lg text-white/60">Her türlü etkinlik için ideal çözüm</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <UseCase icon="🎤" title="Konferanslar ve Seminerler" desc="Büyük toplantılarda soru-cevap oturumları için profesyonel çözüm." />
                        <UseCase icon="📚" title="Eğitim ve Öğretim" desc="Sınıf içi interaktif dersler ve öğrenci katılımını artırma." />
                        <UseCase icon="🏢" title="Kurumsal Toplantılar" desc="Şirket içi sunumlar ve toplantılarda etkileşimi artırın." />
                        <UseCase icon="💻" title="Webinarlar" desc="Online eğitim ve seminerlerde katılımcı etkileşimi." />
                        <UseCase icon="🎉" title="Etkinlikler" desc="Fuar, festival ve organizasyonlarda anlık geri bildirim." />
                        <UseCase icon="📺" title="Canlı Yayınlar" desc="Streaming etkinliklerinde soru-cevap oturumları." />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-red-500/10 to-black" />
                <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Hemen Başlamaya Hazır mısınız?</h2>
                    <p className="text-white/60 text-lg mb-8">
                        Ücretsiz hesap oluşturun ve ilk sunumunuzu dakikalar içinde oluşturun
                    </p>
                    <Link
                        href="/register"
                        className="inline-block px-10 py-4 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl text-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
                    >
                        Ücretsiz Kaydol
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-6 border-t border-white/10 bg-black">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                                <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke="white" strokeWidth="1.6" />
                                <path d="M8.2 10.4C8.6 8.5 10.2 7.2 12.2 7.2C14.6 7.2 16.1 8.7 16.1 10.6C16.1 12.6 14.4 13.4 13.3 14.1C12.6 14.6 12.4 14.9 12.4 16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="12.4" cy="18.5" r="1" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-sm">SoruYorum.Online</div>
                            <div className="text-white/60 text-xs">Etkileşimli sunumlarınızın güçlü ortağı</div>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/kvkk" className="text-white/60 text-sm hover:text-white transition-colors">KVKK</Link>
                        <Link href="/login" className="text-white/60 text-sm hover:text-white transition-colors">Giriş Yap</Link>
                        <Link href="/register" className="text-white/60 text-sm hover:text-white transition-colors">Kayıt Ol</Link>
                    </div>
                </div>
                <p className="text-center text-white/60 text-xs mt-5">© 2025 SoruYorum.Online - Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
    return (
        <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.06] hover:border-red-500/30 hover:-translate-y-1 transition-all">
            <div className="text-4xl mb-5">{emoji}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
    return (
        <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-5 shadow-lg shadow-red-500/30">
                {num}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-white/60 text-sm">{desc}</p>
        </div>
    );
}

function UseCase({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="p-7 bg-white/[0.03] border border-white/10 rounded-2xl flex items-start gap-4 hover:bg-white/[0.06] hover:border-red-500/20 transition-all">
            <div className="text-3xl flex-shrink-0">{icon}</div>
            <div>
                <h4 className="text-lg font-semibold mb-1">{title}</h4>
                <p className="text-white/60 text-sm">{desc}</p>
            </div>
        </div>
    );
}
