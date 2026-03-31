import Link from "next/link";
import { Metadata } from "next";
import { getMarketingNavUser } from "@/lib/getMarketingNavUser";
import { MarketingMainHeader } from "../components/marketing/MarketingMainHeader";
import { MarketingPageChrome } from "../components/marketing/MarketingPageChrome";

export const metadata: Metadata = {
    title: "SoruYorum.Online - İnteraktif Etkinlik Platformu | Canlı Soru-Cevap, Anket, Çarkıfelek",
    description: "SoruYorum.Online ile etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket, Oylama ve daha fazlası. Toplantı, konferans, düğün ve kurumsal etkinlikler için interaktif çözümler.",
    keywords: "interaktif etkinlik platformu, canlı soru cevap, çarkıfelek, selfie wall, anket, oylama, etkinlik yönetimi, toplantı etkileşim, konferans soru cevap, düğün etkileşim, kurumsal etkinlik, SoruYorum, soruyorum online, interaktif sunum, canlı anket, etkinlik uygulaması, QR kod etkinlik, katılımcı etkileşimi, event platform, interaktif toplantı",
    robots: {
        index: true,
        follow: true,
    },
    authors: [{ name: "SoruYorum.Online" }],
    openGraph: {
        type: "website",
        url: "https://soruyorum.online/",
        title: "SoruYorum.Online - İnteraktif Etkinlik Platformu",
        description: "Etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket ve daha fazlası.",
        images: ["https://soruyorum.online/assets/images/favicons/apple-touch-icon.png"],
        siteName: "SoruYorum.Online",
        locale: "tr_TR",
    },
    twitter: {
        card: "summary_large_image",
        title: "SoruYorum.Online - İnteraktif Etkinlik Platformu",
        description: "Etkinliklerinizi interaktif hale getirin. Canlı Soru-Cevap, Çarkıfelek, Selfie Wall, Anket ve daha fazlası.",
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

export default async function LandingPage() {
    const initialNavUser = await getMarketingNavUser();
    return (
        <MarketingPageChrome>
                <MarketingMainHeader navMode="home" initialNavUser={initialNavUser} />

                {/* Main Slider Two Start */}
                <section className="main-slider-two" id="home">
                    {/* Note: JSON in data-swiper-options might need to be escaped or handled via JS. For now keeping as string attribute. */}
                    <div className="swiper-container thm-swiper__slider" data-swiper-options='{"slidesPerView": 1, "loop": true, "effect": "fade", "pagination": { "el": "#main-slider-pagination", "type": "bullets", "clickable": true }, "navigation": { "nextEl": "#main-slider__swiper-button-next", "prevEl": "#main-slider__swiper-button-prev" }, "autoplay": { "delay": 8000 } }'>
                        <div className="swiper-wrapper">
                            <div className="swiper-slide">
                                <div className="main-slider-two__bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/slider-2-1.jpg)' }}></div>
                                <div className="main-slider-two__shape-1"></div>
                                <div className="main-slider-two__shape-2 float-bob-x">
                                    <img src="/assets/images/shapes/main-slider-two-shape-2.png" alt="" />
                                </div>
                                <div className="main-slider-two__shape-3 float-bob-y">
                                    <img src="/assets/images/shapes/main-slider-two-shape-3.png" alt="" />
                                </div>
                                <div className="container">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="main-slider-two__content">
                                                <div className="main-slider-two__sub-title-box">
                                                    <div className="main-slider-two__sub-title-icon">
                                                        <img src="/assets/images/icon/main-slider-sub-title-icon.png" alt="" />
                                                    </div>
                                                    <p className="main-slider-two__sub-title">İnteraktif Etkinlik Çözümleri</p>
                                                </div>
                                                <h2 className="main-slider-two__title">Etkileşimli Sunumlarınızın <br /><span>Güçlü Ortağı</span></h2>
                                                <p className="main-slider-two__text">Canlı etkinlikler, konferanslar ve eğitimler için <br />profesyonel soru-cevap platformu.<br />Katılımcılarınızla anında bağlantı kurun, <br />soruları yönetin ve canlı ekranda görüntüleyin.</p>
                                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                                                    <Link href="/plans-preview" className="thm-btn">
                                                        Fiyatlandırmayı İncele<span className="icon-right-arrow"></span>
                                                    </Link>
                                                    <Link
                                                        href="/#contact"
                                                        className="thm-btn"
                                                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}
                                                    >
                                                        Teklif Al<span className="icon-right-arrow"></span>
                                                    </Link>
                                                </div>
                                                <div className="main-slider-two__shield-check-icon">
                                                    <img src="/assets/images/icon/main-slider-shield-check-icon.png" alt="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="swiper-slide">
                                <div className="main-slider-two__bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/slider-2-2.jpg)' }}></div>
                                <div className="main-slider-two__shape-1"></div>
                                <div className="main-slider-two__shape-2 float-bob-x">
                                    <img src="/assets/images/shapes/main-slider-two-shape-2.png" alt="" />
                                </div>
                                <div className="main-slider-two__shape-3 float-bob-y">
                                    <img src="/assets/images/shapes/main-slider-two-shape-3.png" alt="" />
                                </div>
                                <div className="container">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="main-slider-two__content">
                                                <div className="main-slider-two__sub-title-box">
                                                    <div className="main-slider-two__sub-title-icon">
                                                        <img src="/assets/images/icon/main-slider-sub-title-icon.png" alt="" />
                                                    </div>
                                                    <p className="main-slider-two__sub-title">Canlı Etkileşim Platformu</p>
                                                </div>
                                                <h2 className="main-slider-two__title">Canlı <span>Soru-Cevap</span> <br /><span>ile Katılımcılarınızı</span> <br /> Dinleyin</h2>
                                                <p className="main-slider-two__text">Katılımcılarınızın sorularını anlık olarak <br />toplayın, moderasyon yapın ve yanıtlayın</p>
                                                <div className="main-slider-two__shield-check-icon">
                                                    <img src="/assets/images/icon/main-slider-shield-check-icon.png" alt="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="swiper-slide">
                                <div className="main-slider-two__bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/slider-2-3.jpg)' }}></div>
                                <div className="main-slider-two__shape-1"></div>
                                <div className="main-slider-two__shape-2 float-bob-x">
                                    <img src="/assets/images/shapes/main-slider-two-shape-2.png" alt="" />
                                </div>
                                <div className="main-slider-two__shape-3 float-bob-y">
                                    <img src="/assets/images/shapes/main-slider-two-shape-3.png" alt="" />
                                </div>
                                <div className="container">
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="main-slider-two__content">
                                                <div className="main-slider-two__sub-title-box">
                                                    <div className="main-slider-two__sub-title-icon">
                                                        <img src="/assets/images/icon/main-slider-sub-title-icon.png" alt="" />
                                                    </div>
                                                    <p className="main-slider-two__sub-title">Katılımı Takip Edin</p>
                                                </div>
                                                <h2 className="main-slider-two__title">Hangi katılımcıların <br /><span>Aktif Olduğunu</span> <br /> Anlık İzleyin</h2>
                                                <p className="main-slider-two__text">Sorulan soruları anlık takip edin ve <br />detaylı soru raporlaması ile analiz edin</p>
                                                <div className="main-slider-two__shield-check-icon">
                                                    <img src="/assets/images/icon/main-slider-shield-check-icon.png" alt="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="main-slider-two__nav">
                            <div className="swiper-button-prev" id="main-slider__swiper-button-next">
                                <i className="icon-right-up"></i>
                            </div>
                            <div className="swiper-button-next" id="main-slider__swiper-button-prev">
                                <i className="icon-right-up"></i>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Main Slider Two End */}

                {/* About Two Start */}
                <section className="about-two" id="about">
                    <div className="about-two__shape-2"></div>
                    <div className="about-two__shape-3">
                        <img src="/assets/images/shapes/about-two-shape-3.png" alt="" />
                    </div>
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="about-two__right">
                                    <div className="section-title text-left sec-title-animation animation-style2">
                                        <div className="section-title__tagline-box">
                                            <div className="section-title__tagline-shape-1"></div>
                                            <span className="section-title__tagline">Hakkımızda</span>
                                            <div className="section-title__tagline-shape-2"></div>
                                        </div>
                                        <h2 className="section-title__title title-animation">12006'dan Bu Yana <span>Sizlere Hizmet</span><br /><span>Veriyoruz</span></h2>
                                    </div>
                                    <p className="about-two__text">2006 yılından bu yana sizlere hizmet vermeye devam etmekteyiz. Toplantı ve etkinliklerinizde katılımcılardan anında geri bildirimler elde etmek ve interaktif toplantı ortamı yaratabilmek için kablosuz oylama, yazılım ve aktivite sistemlerimiz ile çözüm alternatifleri sunmaktayız. Siz etkinliğinizi planlarken bizimle yapacağınız iş birliğinde, ekibimize teslim ettiğiniz projenize titizlikle sahip çıkılmasının rahatlığını yaşarsınız. Toplantı ve etkinliklerinizin verimliliğinin artması, aktif katılımın sağlanması ile gerçekleşir ve biz de hizmetini vermiş olduğumuz çözümlerimiz ile yardımcı olmak için buradayız. Ürün ve hizmetlerimiz sizlerin ihtiyacına cevap verecek şekilde güncellenmektedir.</p>
                                    <div className="about-two__points-box">
                                        <ul className="about-two__points-list list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>SoruYorum.Online ile<br /> Gerçek Zamanlı Soru-Cevap</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>SoruYorum.Online<br /> Canlı Katılımcı Yönetimi</p>
                                            </li>
                                        </ul>
                                        <ul className="about-two__points-list list-unstyled">
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>SoruYorum.Online<br /> Canlı Soru Ekranı</p>
                                            </li>
                                            <li>
                                                <div className="icon">
                                                    <span className="icon-tick-inside-circle"></span>
                                                </div>
                                                <p>SoruYorum.Online<br /> Anlık Raporlama</p>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="about-two__experience-contact-and-btn">
                                        <div className="about-two__experience-box">
                                            <div className="about-two__experience-count-box">
                                                <h3 className="odometer" data-count="20">00</h3>
                                                <span>+</span>
                                            </div>
                                            <p className="about-two__experience-text">Yıllık<br /> Deneyim</p>
                                        </div>
                                        <div className="about-two__call-box">
                                            <div className="about-two__call-icon">
                                                <span className="icon-customer-service-headset"></span>
                                            </div>
                                            <div className="about-two__call-content">
                                                <span>Bize Ulaşın</span>
                                                <p><a href="tel:+902125033939">+90 (212) 503 39 39</a></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* About Two End */}

                {/* Services Two Start */}
                <section className="services-two" id="services">
                    <div className="services-two__shape-1"></div>
                    <div className="container">
                        <div className="services-two__top">
                            <div className="section-title text-left sec-title-animation animation-style2">
                                <div className="section-title__tagline-box">
                                    <div className="section-title__tagline-shape-1"></div>
                                    <span className="section-title__tagline">Kullanım Alanları</span>
                                    <div className="section-title__tagline-shape-2"></div>
                                </div>
                                <h2 className="section-title__title title-animation">Her türlü etkinlik için <br /><span>ideal</span> <span>çözüm</span></h2>
                            </div>
                            <Link href="#" className="services-two__round-text-box">
                                <div className="services-two__round-text-box-outer">
                                    <div className="services-two__round-text-box-inner">
                                        <div className="services-two__curved-circle">Tüm Hizmetleri İnceleyin</div>
                                        <div className="services-two__round-icon">
                                            <img src="/assets/images/icon/services-two-round-icon.png" alt="" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        <div className="services-two__bottom">
                            <div className="services-two__services-list">
                                <div className="services-two__services-list-single services-two__services-list-single-1">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Konferanslar ve Seminerler</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Büyük toplantılarda soru-cevap oturumları için profesyonel çözüm.</p>
                                        <ul className="services-two__services-list-inner list-unstyled"></ul>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/a69f4727-815e-4160-0b98-bbb476013100/soruyorum" alt="" />
                                    </div>
                                </div>
                                <div className="services-two__services-list-single services-two__services-list-single-2">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Eğitim ve Öğretim</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Sınıf içi interaktif dersler ve öğrenci katılımını artırma.</p>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/2cafcd87-66fc-4373-ba42-2cd9ebce0f00/soruyorum" alt="" />
                                    </div>
                                </div>
                                <div className="services-two__services-list-single services-two__services-list-single-3">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Kurumsal Toplantılar</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Şirket içi sunumlar ve toplantılarda etkileşimi artırın.</p>
                                        <ul className="services-two__services-list-inner list-unstyled"></ul>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/2e0bfcfe-e57f-4982-fd7d-d595c5e59200/soruyorum" alt="" />
                                    </div>
                                </div>
                                <div className="services-two__services-list-single services-two__services-list-single-3">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Webinarlar</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Online eğitim ve seminerlerde katılımcı etkileşimi.</p>
                                        <ul className="services-two__services-list-inner list-unstyled"></ul>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/2d8eb604-e0ef-40fc-039a-d40660c38800/soruyorum" alt="" />
                                    </div>
                                </div>
                                <div className="services-two__services-list-single services-two__services-list-single-3">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Etkinlikler</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Fuar, festival ve organizasyonlarda anlık geri bildirim.</p>
                                        <ul className="services-two__services-list-inner list-unstyled"></ul>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/0c6e2776-2e2d-49ab-ce38-c545d8986600/soruyorum" alt="" />
                                    </div>
                                </div>
                                <div className="services-two__services-list-single services-two__services-list-single-3">
                                    <div className="services-two__count-and-title">
                                        <div className="services-two__count"></div>
                                        <h3 className="services-two__title">Canlı Yayınlar</h3>
                                    </div>
                                    <div className="services-two__service-list-box">
                                        <p style={{ color: '#696e73', marginBottom: '20px' }}>Streaming etkinliklerinde soru-cevap oturumları.</p>
                                        <ul className="services-two__services-list-inner list-unstyled"></ul>
                                    </div>
                                    <div className="services-two__hover-img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/8fe23d76-b42b-407c-b011-2b72be044100/soruyorum" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Services Two End */}

                {/* Use Cases Start */}
                <section className="portfolio-two">
                    <div className="portfolio-two__shape-1 float-bob-y">
                        <img src="/assets/images/shapes/portfolio-two-shape-1.png" alt="" />
                    </div>
                    <div className="portfolio-two__shape-2"></div>
                    <div className="portfolio-two__shape-3"></div>
                    <div className="portfolio-two__shape-4"></div>
                    <div className="container">
                        <div className="portfolio-two__inner">
                            <div className="portfolio-two__carousel owl-theme owl-carousel" suppressHydrationWarning>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/04a12c07-8a46-4ac1-b5c8-594bc6fb2b00/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Konferanslar ve<br /> Seminerler</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Konferanslar ve Seminerler</h3>
                                                            <p className="portfolio-two__text">Büyük toplantılarda soru-cevap oturumları için profesyonel çözüm.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/fc505fd4-9095-40ac-815a-340e32cd3200/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Eğitim ve<br /> Öğretim</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Eğitim ve Öğretim</h3>
                                                            <p className="portfolio-two__text">Sınıf içi interaktif dersler ve öğrenci katılımını artırma.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/b95cd89d-d385-45ab-1410-9762689d7100/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Kurumsal<br /> Toplantılar</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Kurumsal Toplantılar</h3>
                                                            <p className="portfolio-two__text">Şirket içi sunumlar ve toplantılarda etkileşimi artırın.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/7f5c4a89-f508-4b77-7f28-c19408f52900/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Webinarlar<br /> & Online</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Webinarlar</h3>
                                                            <p className="portfolio-two__text">Online eğitim ve seminerlerde katılımcı etkileşimi.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/b65b52fc-0305-49dc-0610-40784b40e500/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Etkinlikler<br /> & Fuarlar</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Etkinlikler</h3>
                                                            <p className="portfolio-two__text">Fuar, festival ve organizasyonlarda anlık geri bildirim.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="item">
                                    <div className="portfolio-two__single-box">
                                        <ul className="portfolio-two__box list-unstyled">
                                            <li>
                                                <div className="portfolio-two__box-content">
                                                    <div className="single-portfolio-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/07b30c55-9ac9-47b0-d406-c1f0d6575100/soruyorum)' }}></div>
                                                    <div className="portfolio-two__title">
                                                        <h3>Canlı<br /> Yayınlar</h3>
                                                    </div>
                                                    <div className="portfolio-two__content-box">
                                                        <div className="portfolio-two__title-box">
                                                            <h3 className="portfolio-two__title-2">Canlı Yayınlar</h3>
                                                            <p className="portfolio-two__text">Streaming etkinliklerinde soru-cevap oturumları.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Use Cases End */}

                {/* Why Choose One Start */}
                <section className="why-choose-one" id="use-cases">
                    <div className="why-choose-one__shape-3 float-bob-y">
                        <img src="/assets/images/shapes/why-choose-one-shape-3.png" alt="" />
                    </div>
                    <div className="why-choose-one__shape-4"></div>
                    <div className="why-choose-one__shape-5"></div>
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-5">
                                <div className="why-choose-one__left">
                                    <div className="section-title text-left sec-title-animation animation-style2">
                                        <div className="section-title__tagline-box">
                                            <div className="section-title__tagline-shape-1"></div>
                                            <span className="section-title__tagline">Neden Soru-Yorum</span>
                                            <div className="section-title__tagline-shape-2"></div>
                                        </div>
                                        <h2 className="section-title__title title-animation">Tek yönlü sunumlardan <span>çift yönlü diyaloglara geçin.</span><br /><span>Soruyorum.Online</span> ile toplantılarınızı gerçek zamanlı etkileşimle <br />güçlendirin.</h2>
                                    </div>
                                    <p className="why-choose-one__text">Etkinliklerinizde sessiz kalan değerli fikirleri ortaya çıkarıyoruz. Soruyorum.Online ile katılımcılarınız anonim veya isimli soru sorabiliyor, yorum yapabiliyor ve anında geri bildirim verebiliyor. Moderasyon kontrol panelimiz sayesinde binlerce soru arasından en önemlilerini filtreleyip sahneye taşıyabilirsiniz. Profesyonel panel yönetimiyle etkinliklerinizi rakiplerinizden ayırın. Kurumsal ihtiyaçlara tam uyumlu, binlerce katılımcıya hazır.</p>
                                    <ul className="why-choose-one__progress-list list-unstyled">
                                        <li>
                                            <div className="why-choose-one__progress">
                                                <h4 className="why-choose-one__progress-title">Gerçek Zamanlı Etkileşim</h4>
                                                <div className="bar">
                                                    <div className="bar-inner count-bar" data-percent="86%">
                                                        <div className="count-text">98%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="why-choose-one__progress">
                                                <h4 className="why-choose-one__progress-title">Katılımcı Memnuniyeti</h4>
                                                <div className="bar">
                                                    <div className="bar-inner count-bar" data-percent="76%">
                                                        <div className="count-text">94%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-xl-7">
                                <div className="why-choose-one__right wow slideInRight" data-wow-delay="100ms" data-wow-duration="2500ms">
                                    <div className="why-choose-one__img">
                                        <img src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/51b23f15-9608-4946-cd29-95d7c6cfa100/soruyorum" alt="" />
                                    </div>
                                    <div className="why-choose-one__shape-1 img-bounce">
                                        <img src="/assets/images/shapes/why-choose-one-shape-1.png" alt="" />
                                    </div>
                                    <div className="why-choose-one__shape-2 float-bob-x">
                                        <img src="/assets/images/shapes/why-choose-one-shape-2.png" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Why Choose One End */}

                {/* Sliding Text Three Start */}
                <section className="sliding-text-three">
                    <div className="sliding-text-three__wrap">
                        <ul className="sliding-text-three__list list-unstyled marquee_mode">
                            <li><h2 data-hover="UI/UX Design" className="sliding-text-three__title">SORU YORUM</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="Product Design" className="sliding-text-three__title">ETKİLEŞİMLİ TOPLANTILAR</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="Web Development" className="sliding-text-three__title">MARKA ETKİNLİKLERİ</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="BRANDING" className="sliding-text-three__title">LANSMANLAR</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="Cyber Security" className="sliding-text-three__title">KURUMSAL TOPLANTILAR</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="Website design" className="sliding-text-three__title">SORU YORUM</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="Digital Marketing" className="sliding-text-three__title">PANELLER</h2><span className="icon-star"></span></li>
                            <li><h2 data-hover="UI/UX Design" className="sliding-text-three__title">KONGRELER</h2><span className="icon-star"></span></li>
                        </ul>
                    </div>
                </section>
                {/* Sliding Text Three End */}

                {/* Process Two Start */}
                <section className="process-two" id="how-it-works">
                    <div className="process-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/c2a9fd68-140c-4513-d868-7129c5e76400/soruyorum)' }}></div>
                    <div className="process-two__bg-shape float-bob-y" style={{ backgroundImage: 'url(/assets/images/shapes/process-two-bg-shape.png)' }}></div>
                    <div className="container">
                        <div className="section-title text-center sec-title-animation animation-style1">
                            <div className="section-title__tagline-box">
                                <div className="section-title__tagline-shape-1"></div>
                                <span className="section-title__tagline">Nasıl Çalışır?</span>
                                <div className="section-title__tagline-shape-2"></div>
                            </div>
                            <h2 className="section-title__title title-animation">3 Basit Adımda <br /><span>Etkileşimli Sunumlarınıza Başlayın</span></h2>
                        </div>
                        <ul className="row list-unstyled">
                            <li className="col-xl-4 col-lg-4">
                                <div className="process-two__single">
                                    <div className="process-two__count"></div>
                                    <h3 className="process-two__title">Sunum Oluştur</h3>
                                    <p className="process-two__text">Hesabınıza giriş yapın, yeni sunum<br /> oluşturun ve sunum kodunu<br /> alın.</p>
                                </div>
                            </li>
                            <li className="col-xl-4 col-lg-4">
                                <div className="process-two__single">
                                    <div className="process-two__shape-1 float-bob-x">
                                        <img src="/assets/images/shapes/process-two-shape-1.png" alt="" />
                                    </div>
                                    <div className="process-two__shape-2 float-bob-x">
                                        <img src="/assets/images/shapes/process-two-shape-2.png" alt="" />
                                    </div>
                                    <div className="process-two__count"></div>
                                    <h3 className="process-two__title">QR Kod Paylaş</h3>
                                    <p className="process-two__text">QR kodunu ekranda gösterin veya<br /> sunum kodunu katılımcılarla<br /> paylaşın.</p>
                                </div>
                            </li>
                            <li className="col-xl-4 col-lg-4">
                                <div className="process-two__single">
                                    <div className="process-two__count"></div>
                                    <h3 className="process-two__title">Soruları Yönet</h3>
                                    <p className="process-two__text">Gelen soruları moderasyon panelinden<br /> yönetin ve canlı ekranda<br /> görüntüleyin.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>
                {/* Process Two End */}

                {/* Contact Two Start */}
                <section className="contact-two" id="contact">
                    <ul className="contact-two__sliding-text-list list-unstyled marquee_mode-2">
                        <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                        <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                        <li><h2 data-hover="Branding" className="contact-two__sliding-text-title">İLETİŞİM İÇİN *</h2></li>
                    </ul>
                    <div className="contact-two__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/f9ae6050-5a59-4bd6-c80a-d48b5e7c5d00/soruyorum)' }}></div>
                     
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
                {/* Contact Two End */}

                {/* Newsletter Two Start */}
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
                                    <button type="submit" className="thm-btn">Şimdi Abone Ol <span className="icon-right-arrow"></span></button>
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
                {/* Newsletter Two End */}

                {/* Site Footer Two Start */}
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
                {/* Site Footer Two End */}

        </MarketingPageChrome>
    );
}
