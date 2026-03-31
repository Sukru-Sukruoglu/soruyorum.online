"use client";

import Link from "next/link";
import { Logo } from "@ks-interaktif/ui";

type PricingCard = {
    title: string;
    price: string;
    support: string;
    features: string[];
    mutedFeatures: string[];
    cta: string;
    active?: boolean;
};

const pricingCards: PricingCard[] = [
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
            ,
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
    },
    
];

// Ikinci blok kartlarini buradan bagimsiz duzenleyebilirsin.
const additionalPricingCards: PricingCard[] = [
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
        mutedFeatures: [
           
        ],
        cta: "Professional Seç",
    },
    {
        title: "Standard WL",
        price: "10.000 TL",
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
        mutedFeatures: [
           
        ],
        cta: "Professional Seç",
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
        mutedFeatures: [  
        ],
        cta: "Standard Seç",
        active: true,
    },
    
    
];

const multiEventPricingCards: PricingCard[] = [
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

const yearlyUnlimitedPricingCards: PricingCard[] = [
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
    },
];

export default function PricingPreviewClient() {
    return (
        <div className="page-wrapper">
            <style jsx global>{`
                .pricing-one__price {
                    font-size: 42px !important;
                    line-height: 46px !important;
                }
                .pricing-one__points li:nth-child(4) .icon span,
                .pricing-one__points li:nth-child(5) .icon span {
                    transform: none !important;
                    background: linear-gradient(270deg, #5cb0e9 0%, #3d72fc 100%) !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                }
                .pricing-one__points li:nth-child(4) p,
                .pricing-one__points li:nth-child(5) p {
                    color: var(--techguru-white) !important;
                }
                .pricing-one__points li.is-muted .icon span {
                    transform: rotate(-45deg) !important;
                    background: linear-gradient(270deg, #000000 0%, #000000 100%) !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                }
                .pricing-one__points li.is-muted p {
                    color: #000000 !important;
                }
                .pricing-one .col {
                    display: flex;
                }
                .pricing-one__single {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .pricing-one__points {
                    flex-grow: 1;
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
            `}</style>
            <header className="main-header-two">
                <nav className="main-menu main-menu-two">
                    <div className="main-menu-two__wrapper">
                        <div className="main-menu-two__wrapper-inner">
                            <div className="main-menu-two__left">
                                <div className="main-menu-two__logo">
                                    <Link href="/"><Logo variant="dark" size="lg" animate={false} /></Link>
                                </div>
                            </div>
                            <div className="main-menu-two__main-menu-box">
                                <ul className="main-menu__list">
                                    <li><Link href="/">Ana Sayfa</Link></li>
                                    <li><Link href="/plans-preview">Fiyatlandırma</Link></li>
                                    <li><Link href="/join">Etkinliğe Katıl</Link></li>
                                    <li><Link href="/#contact">İletişim</Link></li>
                                </ul>
                            </div>
                            <div className="main-menu-two__right">
                                <div className="main-menu-two__btn-box">
                                    <Link href="/login" className="thm-btn">Giriş Yap <span className="icon-right-arrow"></span></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            <section className="page-header">
                <div className="page-header__bg" style={{ backgroundImage: "url(/assets/images/backgrounds/page-header-bg.jpg)" }}></div>
                <div className="container">
                    <div className="page-header__inner">
                        <h2>Fiyatlandırma</h2>
                        <div className="thm-breadcrumb__box">
                            <ul className="thm-breadcrumb list-unstyled">
                                <li><a href="/">Ana Sayfa</a></li>
                                <li><span className="icon-right-arrow-1"></span></li>
                                <li>Fiyatlandırma</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pricing-one">
                <div className="container-fluid px-3 px-lg-4 px-xl-5">
                    <div className="mx-auto" style={{ maxWidth: "1900px" }}>
                    <div className="section-title text-center sec-title-animation animation-style1">
                        <div className="section-title__tagline-box">
                            <div className="section-title__tagline-shape-1"></div>
                            <span className="section-title__tagline">Pricing &amp; Plan</span>
                            <div className="section-title__tagline-shape-2"></div>
                        </div>
                        <h2 className="section-title__title title-animation">
                            Soruyorum.online <span>Fiyatlandırma</span>
                        </h2>
                    </div>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 justify-content-center">
                        {pricingCards.map((card) => (
                            <div className="col" key={card.title}>
                                <div className="pricing-one__single">
                                    <span className="pricing-one__sub-title">{card.title}</span>
                                    <h2 className="pricing-one__price">{card.price}</h2>
                                    <p className="pricing-one__text">{card.support}</p>
                                    <div className="pricing-one__bdr"></div>
                                    <h5 className="pricing-one__points-title">Özellikler</h5>
                                    <ul className="pricing-one__points list-unstyled">
                                        {card.features.map((feature) => (
                                            <li key={feature}>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                        {card.mutedFeatures.map((feature) => (
                                            <li key={feature} className="is-muted">
                                                <div className="icon">
                                                    <span className="far fa-plus-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pricing-one__btn-box">
                                        <a href="#" className="pricing-one__btn">
                                            {card.cta}
                                            <span className="far fa-plus-circle"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-5 mb-4">
                        <h3 style={{ color: "#ffffff", fontSize: "34px", marginBottom: "8px" }}>
                        Özel Markalı Paketler
                        </h3>
                        <p style={{ color: "#000000", margin: 0 }}>
                        Soruyorum altyapısını kendi markanızla kullanabilirsiniz.
                        Logo, renkler ve alan adınız ile tamamen kurumsal kimliğinize uygun bir deneyim sunun. Katılımcılar etkinliğe kendi domaininiz veya özel subdomain üzerinden katılır.
                        </p>
                    </div>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 mt-4 justify-content-center">
                        {additionalPricingCards.map((card) => (
                            <div className="col" key={`${card.title}-duplicate`}>
                                <div className="pricing-one__single">
                                    <span className="pricing-one__sub-title">{card.title}</span>
                                    <h2 className="pricing-one__price">{card.price}</h2>
                                    <p className="pricing-one__text">{card.support}</p>
                                    <div className="pricing-one__bdr"></div>
                                    <h5 className="pricing-one__points-title">Özellikler</h5>
                                    <ul className="pricing-one__points list-unstyled">
                                        {card.features.map((feature) => (
                                            <li key={`${card.title}-dup-${feature}`}>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                        {card.mutedFeatures.map((feature) => (
                                            <li key={`${card.title}-dup-muted-${feature}`} className="is-muted">
                                                <div className="icon">
                                                    <span className="far fa-plus-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pricing-one__btn-box">
                                        <a href="#" className="pricing-one__btn">
                                            {card.cta}
                                            <span className="far fa-plus-circle"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-5 mb-4">
                        <h3 style={{ color: "#ffffff", fontSize: "34px", marginBottom: "8px" }}>
                            Çoklu Event Paketleri
                        </h3>
                        <p style={{ color: "#000000", margin: 0 }}>
                            Birden fazla etkinliği tek paketle avantajlı fiyatlarla yönetin.
                        </p>
                    </div>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 mt-4 justify-content-center">
                        {multiEventPricingCards.map((card) => (
                            <div className="col" key={`${card.title}-${card.price}-multi`}>
                                <div className="pricing-one__single">
                                    <span className="pricing-one__sub-title">{card.title}</span>
                                    <h2 className="pricing-one__price">{card.price}</h2>
                                    <p className="pricing-one__text">{card.support}</p>
                                    <div className="pricing-one__bdr"></div>
                                    <h5 className="pricing-one__points-title">Özellikler</h5>
                                    <ul className="pricing-one__points list-unstyled">
                                        {card.features.map((feature) => (
                                            <li key={`${card.title}-multi-${feature}`}>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                        {card.mutedFeatures.map((feature) => (
                                            <li key={`${card.title}-multi-muted-${feature}`} className="is-muted">
                                                <div className="icon">
                                                    <span className="far fa-plus-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pricing-one__btn-box">
                                        <a href="#" className="pricing-one__btn">
                                            {card.cta}
                                            <span className="far fa-plus-circle"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-5 mb-4">
                        <h3 style={{ color: "#ffffff", fontSize: "34px", marginBottom: "8px" }}>
                            Yıllık Sınırsız Paket
                        </h3>
                        <p style={{ color: "#000000", margin: 0 }}>
                            Standart ve Özel Markalı yıllık sınırsız paket seçenekleri.
                        </p>
                    </div>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 mt-4 justify-content-center">
                        {yearlyUnlimitedPricingCards.map((card) => (
                            <div className="col" key={`${card.title}-${card.price}-yearly`}>
                                <div className="pricing-one__single">
                                    <span className="pricing-one__sub-title">{card.title}</span>
                                    <h2 className="pricing-one__price">{card.price}</h2>
                                    <p className="pricing-one__text">{card.support}</p>
                                    <div className="pricing-one__bdr"></div>
                                    <h5 className="pricing-one__points-title">Özellikler</h5>
                                    <ul className="pricing-one__points list-unstyled">
                                        {card.features.map((feature) => (
                                            <li key={`${card.title}-yearly-${feature}`}>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                        {card.mutedFeatures.map((feature) => (
                                            <li key={`${card.title}-yearly-muted-${feature}`} className="is-muted">
                                                <div className="icon">
                                                    <span className="far fa-plus-circle"></span>
                                                </div>
                                                <p>{feature}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pricing-one__btn-box">
                                        <a href="#" className="pricing-one__btn">
                                            {card.cta}
                                            <span className="far fa-plus-circle"></span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
            </section>
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
                                    <div className="mb-3">
                                        <Logo variant="dark" size="md" animate={false} />
                                    </div>
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