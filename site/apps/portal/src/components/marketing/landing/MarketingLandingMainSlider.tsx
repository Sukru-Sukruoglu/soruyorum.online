import Link from "next/link";

export function MarketingLandingMainSlider() {
    return (
        <section className="main-slider-two" id="home">
            <div
                className="swiper-container thm-swiper__slider"
                data-swiper-options='{"slidesPerView": 1, "loop": true, "effect": "fade", "pagination": { "el": "#main-slider-pagination", "type": "bullets", "clickable": true }, "navigation": { "nextEl": "#main-slider__swiper-button-next", "prevEl": "#main-slider__swiper-button-prev" }, "autoplay": { "delay": 8000 } }'
            >
                <div className="swiper-wrapper">
                    <div className="swiper-slide">
                        <div
                            className="main-slider-two__bg"
                            style={{ backgroundImage: "url(/assets/images/backgrounds/slider-2-1.jpg)" }}
                        ></div>
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
                                        <h2 className="main-slider-two__title">
                                            Etkileşimli Sunumlarınızın <br />
                                            <span>Güçlü Ortağı</span>
                                        </h2>
                                        <p className="main-slider-two__text">
                                            Canlı etkinlikler, konferanslar ve eğitimler için <br />
                                            profesyonel soru-cevap platformu.
                                            <br />
                                            Katılımcılarınızla anında bağlantı kurun, <br />
                                            soruları yönetin ve canlı ekranda görüntüleyin.
                                        </p>
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                                            <Link href="/plans-preview" className="thm-btn">
                                                Fiyatlandırmayı İncele<span className="icon-right-arrow"></span>
                                            </Link>
                                            <Link
                                                href="/#contact"
                                                className="thm-btn"
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid rgba(255,255,255,0.3)",
                                                    color: "#fff",
                                                }}
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
                        <div
                            className="main-slider-two__bg"
                            style={{ backgroundImage: "url(/assets/images/backgrounds/slider-2-2.jpg)" }}
                        ></div>
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
                                        <h2 className="main-slider-two__title">
                                            Canlı <span>Soru-Cevap</span> <br />
                                            <span>ile Katılımcılarınızı</span> <br /> Dinleyin
                                        </h2>
                                        <p className="main-slider-two__text">
                                            Katılımcılarınızın sorularını anlık olarak <br />
                                            toplayın, moderasyon yapın ve yanıtlayın
                                        </p>
                                        <div className="main-slider-two__shield-check-icon">
                                            <img src="/assets/images/icon/main-slider-shield-check-icon.png" alt="" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="swiper-slide">
                        <div
                            className="main-slider-two__bg"
                            style={{ backgroundImage: "url(/assets/images/backgrounds/slider-2-3.jpg)" }}
                        ></div>
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
                                        <h2 className="main-slider-two__title">
                                            Hangi katılımcıların <br />
                                            <span>Aktif Olduğunu</span> <br /> Anlık İzleyin
                                        </h2>
                                        <p className="main-slider-two__text">
                                            Sorulan soruları anlık takip edin ve <br />
                                            detaylı soru raporlaması ile analiz edin
                                        </p>
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
    );
}
