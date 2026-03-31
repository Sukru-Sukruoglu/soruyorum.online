import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "SoruYorum.Online - İnteraktif Etkinlik Platformu | Canlı Soru-Cevap, Anket, Çarkıfelek",
    description:
        "SoruYorum.Online ile etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket, Oylama ve daha fazlası. Toplantı, konferans, düğün ve kurumsal etkinlikler için interaktif çözümler.",
    keywords:
        "interaktif etkinlik platformu, canlı soru cevap, çarkıfelek, selfie wall, anket, oylama, etkinlik yönetimi, toplantı etkileşim, konferans soru cevap, düğün etkileşim, kurumsal etkinlik, SoruYorum, soruyorum online, interaktif sunum, canlı anket, etkinlik uygulaması, QR kod etkinlik, katılımcı etkileşimi, event platform, interaktif toplantı",
    robots: {
        index: true,
        follow: true,
    },
    authors: [{ name: "SoruYorum.Online" }],
    openGraph: {
        type: "website",
        url: "https://soruyorum.online/",
        title: "SoruYorum.Online - İnteraktif Etkinlik Platformu",
        description:
            "Etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket ve daha fazlası.",
        images: ["https://soruyorum.online/assets/images/favicons/apple-touch-icon.png"],
        siteName: "SoruYorum.Online",
        locale: "tr_TR",
    },
    twitter: {
        card: "summary_large_image",
        title: "SoruYorum.Online - İnteraktif Etkinlik Platformu",
        description:
            "Etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket ve daha fazlası.",
        images: ["https://soruyorum.online/assets/images/favicons/apple-touch-icon.png"],
    },
    icons: {
        icon: [
            { url: "/assets/images/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/assets/images/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        ],
        apple: "/assets/images/favicons/apple-touch-icon.png",
    },
    manifest: "/assets/images/favicons/site.webmanifest",
};
