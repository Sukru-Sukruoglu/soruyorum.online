"use client";

type PlanCard = {
    name: "DENEME" | "OZGUR" | "TEMEL" | "PROFESYONEL" | "GIRISIM";
    subtitle: string;
    price: string;
    priceNote: string;
    cta: string;
    highlighted?: boolean;
    itemsTitle: string;
    items: string[];
};

const plans: PlanCard[] = [
    {
        name: "DENEME",
        subtitle: "Sistemi risksiz test etmek icin.",
        price: "0 TL",
        priceNote: "Sinirsiz toplanti / 20 kullanici / 14 gun",
        cta: "Deneme Hesabi Ac",
        itemsTitle: "Dahil olanlar:",
        items: [
            "20 kullanici limiti",
            "14 gun kullanim hakki",
            "Sinirsiz toplanti olusturma",
            "Temel soru-cevap deneyimi",
        ],
    },
    {
        name: "OZGUR",
        subtitle: "Denemek icin en kolay yol.",
        price: "5.000 TL",
        priceNote: "1 event / 100 kisi",
        cta: "Baslayin",
        itemsTitle: "Dahil olanlar:",
        items: ["50 aylik katilimci", "Temel soru-cevap", "SoruYorum logolu deneyim"],
    },
    {
        name: "TEMEL",
        subtitle: "Bireyler ve kucuk ekipler icin.",
        price: "8.900 TL",
        priceNote: "1 event / 200 kisi",
        cta: "Temel urunleri satin alin",
        itemsTitle: "Ozgur +",
        items: ["Sinirsiz katilimci", "Icerik ice aktarma", "PDF/Excel disa aktarim"],
    },
    {
        name: "PROFESYONEL",
        subtitle: "Buyuyen ekipler icin guclu araclar.",
        price: "13.900 TL",
        priceNote: "1 event / 300 kisi",
        cta: "Pro'yu satin alin",
        highlighted: true,
        itemsTitle: "Temel +",
        items: ["Markalasma ve ozellestirme", "Takim calisma alani", "Gelismis soru-cevap"],
    },
    {
        name: "GIRISIM",
        subtitle: "Buyuk organizasyonlar icin ozel.",
        price: "Ozel fiyat",
        priceNote: "Kuruma ozel teklif",
        cta: "Daha fazla bilgi edinin",
        itemsTitle: "Profesyonel +",
        items: ["SSO ve SCIM", "Ozel veri saklama", "Ozel onboarding ve destek"],
    },
];


export default function PlansV2Client() {
    return (
        <div className="min-h-screen bg-[#f4f4f6] text-[#111111]">
            <section className="px-6 pt-12 pb-14">
                <div className="max-w-7xl mx-auto">
                    <div className="inline-flex items-center rounded-full border border-[#d9d9df] bg-white px-3 py-1 text-xs font-semibold text-black">
                        Plans V2 - Taslak
                    </div>
                    <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-black">Soruyorum.online Fiyatlandirma</h1>
                    <p className="mt-3 max-w-3xl text-black">Gonderdigin ornekteki gibi sade kart yapisinda planlar.</p>
                </div>
            </section>

            <section className="px-6 pb-16">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <article
                            key={plan.name}
                            className={
                                "rounded-3xl border p-6 min-h-[560px] flex flex-col " +
                                (plan.highlighted ? "border-[#b9befd] bg-[#eceeff]" : "border-[#dddddf] bg-white")
                            }
                        >
                            <h2 className="text-4xl leading-none font-black tracking-tight">{plan.name}</h2>
                            <p className="mt-3 text-sm text-[#626272]">{plan.subtitle}</p>

                            <div className="mt-8 text-5xl font-black tracking-tight">{plan.price}</div>
                            <div className="mt-2 text-xs text-[#6f6f7b]">{plan.priceNote}</div>

                            <button
                                className={
                                    "mt-6 h-12 rounded-full border text-sm font-semibold transition " +
                                    (plan.highlighted
                                        ? "bg-[#5b67f6] border-[#5b67f6] text-white hover:bg-[#4b57e6]"
                                        : "bg-white border-[#111111] text-[#111111] hover:bg-[#f3f3f6]")
                                }
                            >
                                {plan.cta}
                            </button>

                            <div className="mt-8 text-sm font-semibold text-[#464654]">{plan.itemsTitle}</div>
                            <ul className="mt-3 space-y-3">
                                {plan.items.map((item) => (
                                    <li key={item} className="text-sm text-[#1f1f2a] leading-relaxed">
                                        • {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section className="pb-20" />
        </div>
    );
}
