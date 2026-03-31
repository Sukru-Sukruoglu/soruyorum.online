import Link from "next/link";
import { Activity, ArrowRight, CreditCard, ShieldCheck, Tags, Users } from "lucide-react";

const CARDS = [
    {
        title: "Kullanicilar",
        href: "/yonetim/kullanicilar",
        description: "Tum hesaplari, rollerini, organizasyon bilgilerini ve kullanici detaylarini inceleyin.",
        icon: Users,
    },
    {
        title: "Odemeler",
        href: "/yonetim/odemeler",
        description: "Paketler, abonelik durumlari, aktivasyon ve gateway kayitlarini tek ekranda yonetin.",
        icon: CreditCard,
    },
    {
        title: "Canli Izleme",
        href: "/yonetim/canli-izleme",
        description: "Aktif kullanicilar, cihaz bilgileri, oturum yogunlugu ve canli durumlari izleyin.",
        icon: Activity,
    },
    {
        title: "Fiyatlandirma",
        href: "/yonetim/fiyatlandirma",
        description: "Paket iceriklerini, fiyat kartlarini ve satisa acik planlari guncelleyin.",
        icon: Tags,
    },
];

export default function YonetimPanelPage() {
    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_rgba(239,68,68,0.16),_rgba(15,23,42,0.88)_42%,_rgba(2,6,23,0.96)_100%)] p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            <ShieldCheck size={14} />
                            Guvenli Yonetim Alani
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                                Tum operasyonel ekranlar tek yonetim panelinde toplandi.
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                                Kullanici yonetimi, odeme operasyonlari, canli izleme ve fiyatlandirma ayarlari ayrik yonetim akisi icinde erisilebilir durumda.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Alanlar</p>
                            <p className="mt-2 text-2xl font-black text-white">4</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Erisim</p>
                            <p className="mt-2 text-2xl font-black text-emerald-300">Super Admin</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {CARDS.map((card) => {
                    const Icon = card.icon;

                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group rounded-[24px] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-red-400/40 hover:bg-red-500/10"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-red-300 transition group-hover:bg-red-500/20 group-hover:text-white">
                                <Icon size={22} />
                            </div>
                            <h3 className="mt-5 text-xl font-bold text-white">{card.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
                            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-200 transition group-hover:text-white">
                                Ekrani ac
                                <ArrowRight size={16} />
                            </div>
                        </Link>
                    );
                })}
            </section>
        </div>
    );
}