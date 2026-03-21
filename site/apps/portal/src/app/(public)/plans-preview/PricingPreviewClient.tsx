"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@ks-interaktif/ui";
import { useRouter } from "next/navigation";
import { createEmptyCart, replaceCart, setAddonEnabled, setPackageLine } from "@/lib/cart";
import { portalNavLabel } from "@/lib/portalNavLabel";
import {
    fetchPortalAuthSession,
    type PortalAuthSession,
} from "@/utils/authSession";
import { useCart } from "@/utils/useCart";

function navLabelFromSession(session: PortalAuthSession): string {
    const trimmed = session.user.name?.trim();
    if (trimmed) return trimmed;
    try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("user_name")?.trim() : "";
        if (stored) return stored;
    } catch {
        /* ignore */
    }
    return portalNavLabel(session);
}

type PricingCard = {
    title: string;
    price: string;
    support: string;
    features: string[];
    mutedFeatures: string[];
    cta: string;
    hidden?: boolean;
    packageId?: string;
    active?: boolean;
};

type PricingSection = {
    id: string;
    label: string;
    description?: string;
    cards: PricingCard[];
};

function parsePriceTL(raw: string): number {
    const cleaned = raw.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
}

const defaultPricingCards: PricingCard[] = [
    {
        title: "EVENT PASS",
        price: "Ücretsiz",
        support: "Deneme hesabı*",
        features: [
            "Aynı anda 50 katılımcı",
            "Soruyorum.online üzerinden kullanım",
            "14 gün sınırsız kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
        ],
        mutedFeatures: [
            "TL Fatura",
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Event Pass Seç",
    },
    {
        title: "Event Starter",
        price: "3.000 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 100 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Starter Seç",
        packageId: "event-starter",
    },
    {
        title: "Event Standard",
        price: "4.500 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 500 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Standard Seç",
        packageId: "event-standard",
        active: true,
    },
    {
        title: "Event Professional",
        price: "9.000 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 2000 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Professional Seç",
        packageId: "event-professional",
    },
];

// Ikinci blok kartlarini buradan bagimsiz duzenleyebilirsin.
const defaultAdditionalPricingCards: PricingCard[] = [
    {
        title: "Starter WL",
        price: "5.000 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 100 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "Professional Seç",
        packageId: "starter-wl",
    },
    {
        title: "Standard WL",
        price: "7.000 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 500 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "Professional Seç",
        packageId: "standard-wl",
    },
    {
        title: "Professional WL",
        price: "20.000 TL",
        support: "*tek etkinlik*",
        features: [
            "Aynı anda 2000 kişi",
            "1 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "Standard Seç",
        packageId: "professional-wl",
        active: true,
    },
];

const defaultMultiEventPricingCards: PricingCard[] = [
    {
        title: "Event Pack",
        price: "18.000 TL",
        support: "*Standart - 5 event*",
        features: [
            "5 etkinlik kullanım hakkı",
            "Aynı anda 500 kişi",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Standart Teklif Al",
    },
    {
        title: "Event Pack",
        price: "32.000 TL",
        support: "*Standart - 10 event*",
        features: [
            "10 etkinlik kullanım hakkı",
            "Aynı anda 500 kişi",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Standart Teklif Al",
        active: true,
    },
    {
        title: "Event Pack WL",
        price: "40.000 TL",
        support: "*Özel Marka - 5 event*",
        features: [
            "Aynı anda 500 kişi",
            "5 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "WL Teklif Al",
    },
    {
        title: "Event Pack WL",
        price: "70.000 TL",
        support: "*Özel Marka - 10 event*",
        features: [
            "Aynı anda 500 kişi",
            "10 etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "WL Teklif Al",
    },
];

const defaultYearlyUnlimitedPricingCards: PricingCard[] = [
    {
        title: "Corporate",
        price: "35.000 TL / yıl",
        support: "*Standart - sınırsız event*",
        features: [
            "Aynı anda 500 kişi",
            "Sınırsız etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Corporate Teklif Al",
        packageId: "corporate",
    },
    {
        title: "Corporate Pro",
        price: "69.000 TL / yıl",
        support: "*Standart - sınırsız event*",
        features: [
            "Aynı anda 2000 kişi",
            "Sınırsız etkinlik kullanım hakkı",
            "Soruyorum.online üzerinden kullanım",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
        ],
        mutedFeatures: [
            "Full branding dahil değil",
            "Özel subdomain / domain dahil değil",
        ],
        cta: "Corporate Pro Teklif Al",
        packageId: "corporate-pro",
        active: true,
    },
    {
        title: "Corporate WL",
        price: "55.000 TL / yıl",
        support: "*Özel Marka - sınırsız event*",
        features: [
           "Aynı anda 500 kişi",
            "Sınırısız etkinlik kullanım hakkı",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "Corporate WL Teklif Al",
        packageId: "corporate-wl",
    },
    {
        title: "Corporate Pro WL",
        price: "120.000 TL / yıl",
        support: "*Özel Marka - sınırsız event*",
        features: [
            "Aynı anda 2000 kişi",
            "Sınırısız etkinlik kullanım hakkı",
            "%100 Türkçe destek",
            "KVKK uyumlu",
            "TL Fatura",
            "Full branding dahil",
            "Özel subdomain / domain dahil",
        ],
        mutedFeatures: [],
        cta: "Corporate Pro WL Teklif Al",
        packageId: "corporate-pro-wl",
    },
];

const defaultSections: PricingSection[] = [
    {
        id: "pricingCards",
        label: "Event Paketleri",
        description: "Tek etkinlik bazlı paketler ile katılımcı sayınıza uygun çözümü seçin.",
        cards: defaultPricingCards,
    },
    {
        id: "additionalPricingCards",
        label: "Özel Markalı Paketler",
        description: "Soruyorum altyapısını kendi markanızla kullanabilirsiniz. Logo, renkler ve alan adınız ile tamamen kurumsal kimliğinize uygun bir deneyim sunun. Katılımcılar etkinliğe kendi domaininiz veya özel subdomain üzerinden katılır.",
        cards: defaultAdditionalPricingCards,
    },
    {
        id: "multiEventPricingCards",
        label: "Çoklu Event Paketleri",
        description: "Birden fazla etkinliği tek paketle avantajlı fiyatlarla yönetin.",
        cards: defaultMultiEventPricingCards,
    },
    {
        id: "yearlyUnlimitedPricingCards",
        label: "Yıllık Sınırsız Paket",
        description: "Standart ve Özel Markalı yıllık sınırsız paket seçenekleri.",
        cards: defaultYearlyUnlimitedPricingCards,
    },
];

type PricingPreviewClientProps = {
    initialNavUser?: { authenticated: boolean; label: string };
};

export default function PricingPreviewClient({ initialNavUser }: PricingPreviewClientProps) {
    const router = useRouter();
    const { lineCount, total } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [sections, setSections] = useState<PricingSection[]>(defaultSections);
    const [selectedCard, setSelectedCard] = useState<PricingCard | null>(null);
    const [addons, setAddons] = useState<{ remote: boolean; onsite: boolean }>({ remote: false, onsite: false });
    const [navUser, setNavUser] = useState<{ authenticated: boolean; label: string }>(
        () => initialNavUser ?? { authenticated: false, label: "" },
    );

    const handleSelectPackage = (card: PricingCard) => {
        setSelectedCard(card);
        setAddons({ remote: false, onsite: false });
    };

    const proceedToCheckout = () => {
        if (!selectedCard?.packageId) {
            router.push("/dashboard/billing");
            return;
        }

        let nextCart = setPackageLine(createEmptyCart(), {
            productId: selectedCard.packageId,
            title: selectedCard.title,
            description: selectedCard.support,
            features: selectedCard.features,
            price: parsePriceTL(selectedCard.price),
        });

        nextCart = setAddonEnabled(nextCart, {
            addonId: "addon_remote",
            title: "Remote Event Operator",
            description: "Uzaktan etkinlik yonetimi ve canli teknik destek. Sadece 1 toplanti veya 1 event icin gecerlidir.",
            price: 7000,
        }, addons.remote);

        nextCart = setAddonEnabled(nextCart, {
            addonId: "addon_onsite",
            title: "On-site Event Operator",
            description: "Yerinde profesyonel operator ve tam kurulum destegi. Sadece 1 toplanti veya 1 event icin gecerlidir.",
            price: 20000,
        }, addons.onsite);

        replaceCart(nextCart);
        setSelectedCard(null);
        router.push("/dashboard/billing");
    };

    // Fetch DB-backed pricing data
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/trpc/settings.getPricing?input=%7B%7D&batch=1");
                const json = await res.json();
                const data = json?.[0]?.result?.data;
                if (data && typeof data === "object" && Array.isArray(data.sections)) {
                    setSections(data.sections);
                }
            } catch {
                // keep defaults on error
            }
        })();
    }, []);

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        let mounted = true;
        const syncNavAuth = () => {
            void fetchPortalAuthSession()
                .then((session) => {
                    if (!mounted) return;
                    if (session.authenticated) {
                        setNavUser({ authenticated: true, label: navLabelFromSession(session) });
                    } else {
                        setNavUser({ authenticated: false, label: "" });
                    }
                })
                .catch(() => {
                    /* Ağ/istek hatasında SSR ile gelen initialNavUser korunur */
                });
        };

        syncNavAuth();
        window.addEventListener("storage", syncNavAuth);
        window.addEventListener("focus", syncNavAuth);
        const onVisibility = () => {
            if (document.visibilityState === "visible") syncNavAuth();
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            mounted = false;
            window.removeEventListener("storage", syncNavAuth);
            window.removeEventListener("focus", syncNavAuth);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <div className="page-wrapper">
            <style jsx global>{`
                .pricing-one__price {
                    font-size: 42px !important;
                    line-height: 46px !important;
                }
                .pricing-one__points li:not(.is-muted) .icon span {
                    transform: none !important;
                    background: linear-gradient(270deg, #5cb0e9 0%, #3d72fc 100%) !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                }
                .pricing-one__points li:not(.is-muted) p {
                    color: var(--techguru-white) !important;
                }
                .pricing-one__points li.is-muted .icon span {
                    transform: rotate(-45deg) !important;
                    background: linear-gradient(270deg, #c5c8cd 0%, #c5c8cd 100%) !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                }
                .pricing-one__points li.is-muted p {
                    color: #c5c8cd !important;
                }
                .pricing-one .col {
                    display: flex;
                }
                .pricing-one__single {
                    width: 100%;
                    height: 100%;
                    min-height: 640px;
                    display: flex;
                    flex-direction: column;
                }
                .pricing-one__points {
                    flex-grow: 1;
                }
                .pricing-one__btn-box {
                    margin-top: auto;
                }
                @media (max-width: 1199px) {
                    .pricing-one__single {
                        min-height: 610px;
                    }
                }
                @media (max-width: 767px) {
                    .pricing-one__single {
                        min-height: 0;
                    }
                }
                @keyframes contactMarqueeMove {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-40%);
                    }
                }
                .contact-two .contact-two__sliding-text-list {
                    display: flex !important;
                    width: max-content;
                    animation: contactMarqueeMove 18s linear infinite;
                    will-change: transform;
                }
                .contact-two .contact-two__sliding-text-list li {
                    white-space: nowrap;
                    margin-right: 48px;
                }
                .main-header-two {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 1000;
                }
                .pricing-one {
                    padding-top: 190px;
                }
                .main-header-two .main-menu-two__wrapper,
                .main-header-two .main-menu-two__top {
                    transition: background-color 280ms ease, box-shadow 280ms ease, border-color 280ms ease;
                    background-color: transparent !important;
                    box-shadow: none !important;
                    border-color: transparent !important;
                }
                .main-header-two.header-scrolled .main-menu-two__top {
                    background-color: rgba(7, 20, 45, 0.96) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .main-header-two.header-scrolled .main-menu-two__wrapper {
                    background-color: rgba(9, 25, 54, 0.96) !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                }
                .pricing-cart-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    border-radius: 999px;
                    border: 1px solid rgba(96, 165, 250, 0.28);
                    background: rgba(8, 18, 37, 0.78);
                    color: #fff;
                    text-decoration: none;
                    box-shadow: 0 10px 24px rgba(2, 6, 23, 0.18);
                }
                .pricing-cart-chip__count {
                    min-width: 28px;
                    height: 28px;
                    padding: 0 8px;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #2563eb, #0ea5e9);
                    color: #fff;
                    font-size: 12px;
                    font-weight: 800;
                }
                .pricing-cart-fab {
                    position: fixed;
                    right: 16px;
                    bottom: 16px;
                    z-index: 1001;
                    display: none;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    min-width: min(320px, calc(100vw - 32px));
                    padding: 14px 16px;
                    border-radius: 18px;
                    background: linear-gradient(135deg, rgba(8,18,37,0.96), rgba(22,37,68,0.96));
                    border: 1px solid rgba(96,165,250,0.24);
                    box-shadow: 0 18px 40px rgba(2, 6, 23, 0.32);
                    color: #fff;
                    text-decoration: none;
                }
                @media (max-width: 768px) {
                    .pricing-cart-chip {
                        display: none;
                    }
                    .pricing-cart-fab {
                        display: inline-flex;
                    }
                }
            `}</style>
            <header className={`main-header-two${isScrolled ? " header-scrolled" : ""}`}>
                <div className="main-menu-two__top">
                    <div className="main-menu-two__top-inner">
                        <p className="main-menu-two__top-text">SoruYorum.Online - Etkinliklerinizi İnteraktif Hale Getirin</p>
                        <ul className="list-unstyled main-menu-two__contact-list">
                            <li>
                                <div className="icon">
                                    <i className="icon-pin"></i>
                                </div>
                                <div className="text">
                                    <p>İstanbul, Türkiye</p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                    <i className="icon-search-mail"></i>
                                </div>
                                <div className="text">
                                    <p><a href="mailto:info@soruyorum.online">info@soruyorum.online</a></p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                    <i className="icon-phone-call"></i>
                                </div>
                                <div className="text">
                                    <p><a href="tel:+902125033939">+90 (212) 503 39 39</a></p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <nav className="main-menu main-menu-two">
                    <div className="main-menu-two__wrapper">
                        <div className="main-menu-two__wrapper-inner">
                            <div className="main-menu-two__left">
                                <div className="main-menu-two__logo">
                                    <Link href="/"><Logo variant="dark" size="lg" animate={true} /></Link>
                                </div>
                            </div>
                            <div className="main-menu-two__main-menu-box">
                                <a href="#" className="mobile-nav__toggler"><i className="fa fa-bars"></i></a>
                                <ul className="main-menu__list one-page-scroll-menu">
                                    <li><Link href="/">Ana Sayfa</Link></li>
                                    <li><Link href="#about">Hakkımızda</Link></li>
                                    <li><Link href="/plans-preview">Fiyatlandırma</Link></li>
                                    <li><Link href="#services">Kullanım Alanları</Link></li>
                                    <li><Link href="#use-cases">Neden Soru-Yorum</Link></li>
                                    <li><Link href="#how-it-works">Nasıl Çalışır</Link></li>
                                    <li><Link href="#contact">İletişim</Link></li>
                                </ul>
                            </div>
                            <div className="main-menu-two__right">
                                <div className="main-menu-two__btn-box">
                                    {lineCount > 0 && (
                                        <Link href="/dashboard/billing" className="pricing-cart-chip">
                                            <span className="pricing-cart-chip__count">{lineCount}</span>
                                            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                                                <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 700 }}>Sepet Hazir</span>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{total.toLocaleString("tr-TR")} TL</span>
                                            </span>
                                        </Link>
                                    )}
                                    {navUser.authenticated ? (
                                        <Link
                                            href="/dashboard"
                                            className="thm-btn"
                                            title="Kontrol paneline git"
                                            style={{ maxWidth: 260 }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    maxWidth: 220,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    verticalAlign: "bottom",
                                                }}
                                            >
                                                {navUser.label}
                                            </span>{" "}
                                            <span className="icon-right-arrow"></span>
                                        </Link>
                                    ) : (
                                        <Link href="/login" className="thm-btn">
                                            Giriş Yap <span className="icon-right-arrow"></span>
                                        </Link>
                                    )}
                                </div>
                                <div className="main-menu-two__nav-sidebar-icon">
                                    <a className="navSidebar-button" href="#">
                                        <span className="icon-dots-menu-one"></span>
                                        <span className="icon-dots-menu-two"></span>
                                        <span className="icon-dots-menu-three"></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            {lineCount > 0 && (
                <Link href="/dashboard/billing" className="pricing-cart-fab">
                    <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                        <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 700 }}>Sepete Git</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{lineCount} urun • {total.toLocaleString("tr-TR")} TL</span>
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>→</span>
                </Link>
            )}
            <div className="stricky-header stricked-menu main-menu main-menu-two">
                <div className="sticky-header__content"></div>
            </div>

            <section className="pricing-one">
                <div className="container-fluid px-3 px-lg-4 px-xl-5">
                    <div className="mx-auto" style={{ maxWidth: "1900px" }}>
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <h2 className="section-title__title title-animation">
                            Soruyorum.online <span>Fiyatlandırma</span>
                        </h2>
                    </div>
                    {sections.filter(s => s.cards.some(c => !c.hidden)).map((section, sIdx) => (
                        <div key={section.id}>
                            <div className={`text-center ${sIdx === 0 ? "mb-4" : "mt-5 mb-4"}`}>
                                <h3 style={{ color: "#ffffff", fontSize: "34px", marginBottom: "8px" }}>
                                    {section.label}
                                </h3>
                                {section.description && (
                                    <p style={{ color: "#c5c8cd", margin: 0 }}>
                                        {section.description}
                                    </p>
                                )}
                            </div>
                            <div className={`row row-cols-1 row-cols-md-2 row-cols-lg-3 ${section.cards.filter(c => !c.hidden).length >= 4 ? "row-cols-xl-4" : ""} g-4 ${sIdx > 0 ? "mt-4" : ""} justify-content-center`}>
                                {section.cards.filter(c => !c.hidden).map((card, cIdx) => (
                                    <div className="col" key={`${section.id}-${cIdx}`}>
                                        <div className="pricing-one__single">
                                            <span className="pricing-one__sub-title">{card.title}</span>
                                            <h2 className="pricing-one__price">{card.price}</h2>
                                            <p className="pricing-one__text">{card.support}</p>
                                            <div className="pricing-one__bdr"></div>
                                            <h5 className="pricing-one__points-title">Özellikler</h5>
                                            <ul className="pricing-one__points list-unstyled">
                                                {card.features.map((feature) => (
                                                    <li key={`${section.id}-${cIdx}-${feature}`}>
                                                        <div className="icon">
                                                            <span className="icon-tick-inside-circle"></span>
                                                        </div>
                                                        <p>{feature}</p>
                                                    </li>
                                                ))}
                                                {card.mutedFeatures.map((feature) => (
                                                    <li key={`${section.id}-${cIdx}-m-${feature}`} className="is-muted">
                                                        <div className="icon">
                                                            <span className="far fa-plus-circle"></span>
                                                        </div>
                                                        <p>{feature}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="pricing-one__btn-box">
                                                <button
                                                    onClick={() => handleSelectPackage(card)}
                                                    className="pricing-one__btn"
                                                    style={{ cursor: "pointer", border: "none", width: "100%" }}
                                                >
                                                    Sepete Ekle
                                                    <span className="far fa-plus-circle"></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </section>

            {/* ── Ek Hizmet Seçim Modalı ── */}
            {selectedCard && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 20,
                    }}
                    onClick={() => setSelectedCard(null)}
                >
                    <div
                        style={{
                            background: "linear-gradient(145deg, #0f1d36, #162544)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 20, maxWidth: 520, width: "100%",
                            padding: "36px 32px", position: "relative",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedCard(null)}
                            style={{
                                position: "absolute", top: 16, right: 20,
                                background: "none", border: "none", color: "#aaa",
                                fontSize: 22, cursor: "pointer", lineHeight: 1,
                            }}
                        >✕</button>

                        <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 4, marginTop: 0 }}>
                            Seçiminiz
                        </h3>
                        <div style={{
                            background: "rgba(255,255,255,0.06)", borderRadius: 12,
                            padding: "16px 20px", marginBottom: 24, marginTop: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{selectedCard.title}</span>
                                <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{selectedCard.price}</span>
                            </div>
                            {selectedCard.support && (
                                <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>{selectedCard.support}</p>
                            )}
                        </div>

                        <h4 style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 14, marginTop: 0 }}>
                            Ek Hizmetler <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 13 }}>(opsiyonel)</span>
                        </h4>

                        <div
                            style={{
                                background: "rgba(251,191,36,0.08)",
                                border: "1px solid rgba(251,191,36,0.24)",
                                borderRadius: 12,
                                padding: "12px 14px",
                                color: "#fde68a",
                                fontSize: 13,
                                lineHeight: 1.6,
                                marginBottom: 14,
                            }}
                        >
                            Ek paketler kurumsal hesaba kalici olarak tanimlanmaz. Her bir ek hizmet sadece 1 toplanti veya 1 event icin gecerlidir.
                        </div>

                        <label
                            style={{
                                display: "flex", alignItems: "flex-start", gap: 14,
                                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                                marginBottom: 10,
                                background: addons.remote ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                                border: addons.remote ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                transition: "all 0.2s",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={addons.remote}
                                onChange={(e) => setAddons((prev) => ({ ...prev, remote: e.target.checked }))}
                                style={{ marginTop: 3, accentColor: "#3b82f6", width: 18, height: 18 }}
                            />
                            <div>
                                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Remote Event Operator</div>
                                <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>Uzaktan etkinlik yönetimi ve canli teknik destek</div>
                                <div style={{ color: "#fbbf24", fontSize: 12, marginTop: 4 }}>Sadece 1 event / 1 toplanti icin gecerlidir</div>
                                <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15, marginTop: 4 }}>+7.000 TL</div>
                            </div>
                        </label>

                        <label
                            style={{
                                display: "flex", alignItems: "flex-start", gap: 14,
                                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                                background: addons.onsite ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
                                border: addons.onsite ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                transition: "all 0.2s",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={addons.onsite}
                                onChange={(e) => setAddons((prev) => ({ ...prev, onsite: e.target.checked }))}
                                style={{ marginTop: 3, accentColor: "#3b82f6", width: 18, height: 18 }}
                            />
                            <div>
                                <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>On-site Event Operator</div>
                                <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>Yerinde profesyonel operatör ve tam kurulum desteği</div>
                                <div style={{ color: "#fbbf24", fontSize: 12, marginTop: 4 }}>Sadece 1 event / 1 toplanti icin gecerlidir</div>
                                <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15, marginTop: 4 }}>+20.000 TL</div>
                            </div>
                        </label>

                        <button
                            type="button"
                            onClick={proceedToCheckout}
                            style={{
                                display: "block", width: "100%", marginTop: 24,
                                padding: "14px 0", borderRadius: 12,
                                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                                color: "#fff", fontWeight: 700, fontSize: 16,
                                textAlign: "center", textDecoration: "none",
                                transition: "opacity 0.2s",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Sepete Ekle ve Devam Et →
                        </button>
                    </div>
                </div>
            )}

            <section className="contact-two" id="contact">
                <ul className="contact-two__sliding-text-list list-unstyled marquee_mode-2">
                    <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                    <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                    <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                </ul>
                <div className="contact-two__shape-1 float-bob-y">
                    <img src="/assets/images/shapes/contact-two-shape-1.png" alt="" />
                </div>
                <div className="contact-two__shape-2"></div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="contact-two__left">
                                <div className="section-title text-left sec-title-animation animation-style2">
                                    <div className="section-title__tagline-box">
                                        <div className="section-title__tagline-shape-1"></div>
                                        <span className="section-title__tagline">İletişim</span>
                                        <div className="section-title__tagline-shape-2"></div>
                                    </div>
                                    <h2 className="section-title__title title-animation">Bizimle <span>İletişime</span><br /><span>Geçin</span></h2>
                                </div>
                                <p className="contact-two__text">Sorularınız ve talepleriniz için bizimle iletişime geçin.</p>
                                <ul className="contact-two__contact-list list-unstyled">
                                    <li>
                                        <div className="icon">
                                            <span className="icon-mail"></span>
                                        </div>
                                        <div className="content">
                                            <span>E-posta</span>
                                            <p><a href="mailto:info@soruyorum.online">info@soruyorum.online</a></p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-phone-call"></span>
                                        </div>
                                        <div className="content">
                                            <span>Telefon</span>
                                            <p>
                                                <a href="tel:+905322268040">+90 (532) 226 80 40</a><br />
                                                <a href="tel:+902125033939">+90 (212) 503 39 39</a>
                                            </p>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="icon">
                                            <span className="icon-pin"></span>
                                        </div>
                                        <div className="content">
                                            <span>Adres</span>
                                            <p>İstanbul, Kavacık Mh., Fatih Sultan Mehmet Cd.<br />Tonoğlu Plaza No:3 Kat:4, Beykoz/İstanbul</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="contact-two__right wow slideInRight" data-wow-delay="100ms" data-wow-duration="2500ms">
                                <form className="contact-form-validated contact-one__form" action="/assets/inc/sendemail.php" method="post" noValidate>
                                    <div className="row">
                                        <div className="col-xl-6 col-lg-6">
                                            <h4 className="contact-one__input-title">Ad Soyad</h4>
                                            <div className="contact-one__input-box">
                                                <div className="contact-one__input-icon">
                                                    <span className="icon-user-1"></span>
                                                </div>
                                                <input type="text" name="name" placeholder="Adınız Soyadınız" required />
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-lg-6">
                                            <h4 className="contact-one__input-title">E-posta Adresi</h4>
                                            <div className="contact-one__input-box">
                                                <div className="contact-one__input-icon">
                                                    <span className="icon-email"></span>
                                                </div>
                                                <input type="email" name="email" placeholder="ornek@domain.com" required />
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-lg-6">
                                            <h4 className="contact-one__input-title">Telefon Numarası</h4>
                                            <div className="contact-one__input-box">
                                                <div className="contact-one__input-icon">
                                                    <span className="icon-phone-call"></span>
                                                </div>
                                                <input type="text" name="Phone" placeholder="+90 (5xx) xxx xx xx" required />
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-lg-6">
                                            <h4 className="contact-one__input-title">Konu</h4>
                                            <div className="contact-one__input-box">
                                                <div className="select-box" suppressHydrationWarning>
                                                    <select className="selectmenu wide" defaultValue="Konu Seçiniz" suppressHydrationWarning>
                                                        <option disabled>Konu Seçiniz</option>
                                                        <option>Demo Talebi</option>
                                                        <option>Satış / Teklif</option>
                                                        <option>Destek</option>
                                                        <option>İş Birliği</option>
                                                        <option>Diğer</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-12">
                                        <h4 className="contact-one__input-title">Mesajınız</h4>
                                        <div className="contact-one__input-box text-message-box">
                                            <div className="contact-one__input-icon">
                                                <span className="icon-edit"></span>
                                            </div>
                                            <textarea name="message" placeholder="Mesajınızı yazın"></textarea>
                                        </div>
                                        <div className="contact-one__btn-box">
                                            <button type="submit" className="thm-btn"><span>Gönder</span><i className="icon-right-arrow"></i></button>
                                        </div>
                                    </div>
                                </form>
                                <div className="result"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="newsletter-two">
                <div className="newsletter-two__shape-1">
                    <img src="/assets/images/shapes/newsletter-two-shape-1.png" alt="" />
                </div>
                <div className="newsletter-two__shape-2 float-bob-x">
                    <img src="/assets/images/shapes/newsletter-two-shape-2.png" alt="" />
                </div>
                <div className="container">
                    <div className="newsletter-two__inner">
                        <div className="newsletter-two__left">
                            <h2 className="newsletter-two__title">Bültenimize Abone Olun</h2>
                            <p className="newsletter-two__text">En yeni SEO ipuçlarını ve yazılım içgörülerini doğrudan gelen kutunuza alın.</p>
                        </div>
                        <div className="newsletter-two__right">
                            <form className="newsletter-two__form">
                                <div className="newsletter-two__input">
                                    <input type="email" name="email" placeholder="E-posta adresinizi girin" required />
                                </div>
                                <button type="submit" className="thm-btn">Şimdi Abone Ol <span className="icon-right-arrow"></span>
                                </button>
                                <div className="checked-box">
                                    <input type="checkbox" name="skipper1" id="skipper" defaultChecked />
                                    <label htmlFor="skipper"><span></span>Abone olarak Gizlilik Politikamızı kabul etmiş olursunuz.</label>
                                </div>
                                <div className="result"></div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
            <footer className="site-footer-two">
                <div className="site-footer-two__bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="site-footer-two__bottom-inner text-center">
                                    <div className="site-footer-two__copyright">
                                        <p className="site-footer-two__copyright-text">
                                            © 2026 Soru-Yorum. Tüm hakları <a href="https://www.keypadsistem.com">Keypad Sistem İletişim Bilişim Turz. Tic. Ltd. Şti.</a> tarafından saklıdır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}