import Link from "next/link";

/** Ana sayfadaki hero + hakkımızda + alt bilgi — /about rotası için yeniden kullanılır. */
export function MarketingAboutStaticSections() {
  return (
    <>
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
                  <h2 className="section-title__title title-animation">
                    2006'dan Bu Yana <span>Sizlere Hizmet</span>
                    <br />
                    <span>Veriyoruz</span>
                  </h2>
                </div>
                <p className="about-two__text">
                  2006 yılından bu yana sizlere hizmet vermeye devam etmekteyiz. Toplantı ve etkinliklerinizde
                  katılımcılardan anında geri bildirimler elde etmek ve interaktif toplantı ortamı yaratabilmek için
                  kablosuz oylama, yazılım ve aktivite sistemlerimiz ile çözüm alternatifleri sunmaktayız. Siz
                  etkinliğinizi planlarken bizimle yapacağınız iş birliğinde, ekibimize teslim ettiğiniz projenize
                  titizlikle sahip çıkılmasının rahatlığını yaşarsınız. Toplantı ve etkinliklerinizin verimliliğinin
                  artması, aktif katılımın sağlanması ile gerçekleşir ve biz de hizmetini vermiş olduğumuz
                  çözümlerimiz ile yardımcı olmak için buradayız. Ürün ve hizmetlerimiz sizlerin ihtiyacına cevap
                  verecek şekilde güncellenmektedir.
                </p>
                <div className="about-two__points-box">
                  <ul className="about-two__points-list list-unstyled">
                    <li>
                      <div className="icon">
                        <span className="icon-tick-inside-circle"></span>
                      </div>
                      <p>
                        SoruYorum.Online ile
                        <br /> Gerçek Zamanlı Soru-Cevap
                      </p>
                    </li>
                    <li>
                      <div className="icon">
                        <span className="icon-tick-inside-circle"></span>
                      </div>
                      <p>
                        SoruYorum.Online
                        <br /> Canlı Katılımcı Yönetimi
                      </p>
                    </li>
                  </ul>
                  <ul className="about-two__points-list list-unstyled">
                    <li>
                      <div className="icon">
                        <span className="icon-tick-inside-circle"></span>
                      </div>
                      <p>
                        SoruYorum.Online
                        <br /> Canlı Soru Ekranı
                      </p>
                    </li>
                    <li>
                      <div className="icon">
                        <span className="icon-tick-inside-circle"></span>
                      </div>
                      <p>
                        SoruYorum.Online
                        <br /> Anlık Raporlama
                      </p>
                    </li>
                  </ul>
                </div>
                <div className="about-two__experience-contact-and-btn">
                  <div className="about-two__experience-box">
                    <div className="about-two__experience-count-box">
                      <h3 className="odometer" data-count="20">
                        00
                      </h3>
                      <span>+</span>
                    </div>
                    <p className="about-two__experience-text">
                      Yıllık
                      <br /> Deneyim
                    </p>
                  </div>
                  <div className="about-two__call-box">
                    <div className="about-two__call-icon">
                      <span className="icon-customer-service-headset"></span>
                    </div>
                    <div className="about-two__call-content">
                      <span>Bize Ulaşın</span>
                      <p>
                        <a href="tel:+902125033939">+90 (212) 503 39 39</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                      © 2026 Soru-Yorum. Tüm hakları{" "}
                      <a href="https://www.keypadsistem.com">Keypad Sistem İletişim Bilişim Turz. Tic. Ltd. Şti.</a>{" "}
                      tarafından saklıdır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
