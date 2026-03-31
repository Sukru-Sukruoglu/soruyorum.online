"use client";

import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    MonitorPlay,
    QrCode,
    ShieldCheck,
    Sparkles,
    Star,
} from "lucide-react";

function VisualCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="aspect-[16/9] w-full rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 flex items-center justify-center">
                <div className="text-center px-4">
                    <p className="text-sm font-black text-white/90">{title}</p>
                    <p className="text-xs text-white/60 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}

function Step({
    icon: Icon,
    title,
    detail,
    visualTitle,
    visualDescription,
}: {
    icon: React.ElementType;
    title: string;
    detail: string;
    visualTitle: string;
    visualDescription: string;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 px-4 py-3 text-white">
                    <Icon size={20} />
                    <span className="font-black">{title}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{detail}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>Bu adım tamamlanınca bir sonraki adıma geçin.</span>
                </div>
            </div>
            <div>
                <VisualCard title={visualTitle} description={visualDescription} />
            </div>
        </div>
    );
}

export default function HowToPage() {
    const joinHost = "mobil.soruyorum.online";
    const screenHost = "ekran.soruyorum.online";

    return (
        <div className="p-8 space-y-8 max-w-6xl">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Nasıl Kullanılır?</h1>
                    <p className="text-gray-500 mt-2">
                        2 dakikada “SoruSor” etkinliği başlatma rehberi. (Organizasyon verilerinize göre çalışır.)
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-5 py-3 font-bold hover:bg-black transition"
                >
                    Dashboard’a dön <ArrowRight size={18} />
                </Link>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-900 to-black p-6 text-white">
                <div className="flex items-center gap-3">
                    <Sparkles className="text-yellow-400" />
                    <p className="font-black text-lg">Hızlı Özet</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-black">1) Etkinlik oluştur</p>
                        <p className="text-xs text-white/70 mt-1">Pin/QR otomatik oluşur.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-black">2) Katılımı aç</p>
                        <p className="text-xs text-white/70 mt-1">Kullanıcılar {joinHost} üzerinden girer.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-black">3) Moderasyon + Ekran</p>
                        <p className="text-xs text-white/70 mt-1">Onayla, istersen “Öne Çıkan Soru” seç.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <Step
                    icon={ClipboardList}
                    title="1) Yeni Etkinlik Oluştur"
                    detail="Dashboard’dan “Yeni Etkinlik” ile SoruSor etkinliğini oluşturun. Sistem otomatik PIN ve QR üretir. Etkinliğin adını ve temel ayarlarını düzenleyin."
                    visualTitle="Etkinlik Oluşturma"
                    visualDescription="Yeni Etkinlik → Canlı Soru/SoruSor"
                />

                <Step
                    icon={QrCode}
                    title="2) Katılımcıları Davet Et"
                    detail={`Katılımcılar ${joinHost} adresinden PIN ile katılır. Ekranda QR kodu da gösterilebilir. Bu sayede topluluğa hızlı katılım sağlanır.`}
                    visualTitle="PIN + QR"
                    visualDescription="Katılım URL + QR ile giriş"
                />

                <Step
                    icon={ShieldCheck}
                    title="3) Moderatör Panelinden Onayla"
                    detail="Gelen sorular önce moderasyon ekranına düşer. Onayladığınız sorular ekranda görünür. İsterseniz anonim mod ve soru gönderimini durdurma gibi ayarları da buradan yönetirsiniz."
                    visualTitle="Moderasyon"
                    visualDescription="Bekleyen → Onaylı akışı"
                />

                <Step
                    icon={Star}
                    title="4) Öne Çıkan Soru (İsteğe Bağlı)"
                    detail="Büyük ekranda tek bir soruyu spotlight yapmak için moderatörden “Öne Çıkan Soru” seçebilirsiniz. Bu seçim ekran alt-domain’inde anlık görünür."
                    visualTitle="Öne Çıkan"
                    visualDescription="Tek soru spotlight"
                />

                <Step
                    icon={MonitorPlay}
                    title="5) Büyük Ekranı Aç"
                    detail={`Sunum ekranını açın: ${screenHost}. Ekran görünümünü “Duvar / Tek tek” olarak etkinlik ayarlarından seçebilirsiniz. Scroll yoksa ekran, sığan kadar en yeni kartı gösterir.`}
                    visualTitle="Ekran"
                    visualDescription="Duvar / Tek tek modu"
                />
            </div>
        </div>
    );
}
