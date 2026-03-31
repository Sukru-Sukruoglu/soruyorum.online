import Script from "next/script";
import Link from "next/link";
import { Metadata } from "next";
import { PreloaderDismissal } from "../../../components/PreloaderDismissal";

export const metadata: Metadata = {
    title: "KVKK Açık Rıza Metni - SoruYorum.Online",
    description: "SoruYorum.Online KVKK Açık Rıza Metni. Kişisel verilerinizin işlenmesine ilişkin açık rıza beyanı.",
    robots: {
        index: true,
        follow: true,
    },
};

export default function AcikRizaPage() {
    return (
        <>
            <PreloaderDismissal />
            {/* Shared CSS for KVKK and Acik Riza */}
            <link rel="stylesheet" href="/assets/css/module-css/kvkk.css" />

            {/* Shared CSS for KVKK and Acik Riza */}
            <link rel="stylesheet" href="/assets/css/module-css/kvkk.css" />



            {/* Preloader Div - Handled by PreloaderDismissal */}
            <div className="loader js-preloader" suppressHydrationWarning>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <div className="page-wrapper">
                <header className="main-header-two">
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
                                        <Link href="/"><img src="/assets/images/SoruYorumLogoSon.png" alt="" width="250" /></Link>
                                    </div>
                                </div>
                                <div className="main-menu-two__main-menu-box">
                                    <a href="#" className="mobile-nav__toggler"><i className="fa fa-bars"></i></a>
                                    <ul className="main-menu__list one-page-scroll-menu">
                                        <li className="scrollToLink"><Link href="/">Ana Sayfa</Link></li>
                                        <li className="scrollToLink"><Link href="/#about">Hakkımızda</Link></li>
                                        <li className="scrollToLink"><Link href="/#services">Kullanım Alanları</Link></li>
                                        <li className="scrollToLink"><Link href="/#use-cases">Neden Soru-Yorum</Link></li>
                                        <li className="scrollToLink"><Link href="/#how-it-works">Nasıl Çalışır</Link></li>
                                        <li className="scrollToLink"><Link href="/#contact">İletişim</Link></li>
                                    </ul>
                                </div>
                                <div className="main-menu-two__right">
                                    <div className="main-menu-two__btn-box" style={{ display: 'flex', gap: '10px' }} id="auth-buttons">
                                        <Link href="/login" className="thm-btn" id="btn-login" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>Giriş<span className="icon-right-arrow"></span></Link>
                                        <Link href="/register" className="thm-btn" id="btn-register">Kayıt<span className="icon-right-arrow"></span></Link>
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

                <div className="stricky-header stricked-menu main-menu main-menu-two">
                    <div className="sticky-header__content"></div>
                </div>

                {/* Page Header Start */}
                <section className="page-header">
                    <div className="page-header__bg" style={{ backgroundImage: 'url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/48ca798a-012e-496c-720b-b4a2767c0900/soruyorum)' }}></div>
                    <div className="container">
                        <div className="page-header__inner">
                            <h2>Açık Rıza Metni</h2>
                            <div className="thm-breadcrumb__box">
                                <ul className="thm-breadcrumb list-unstyled">
                                    <li><Link href="/"><i className="fas fa-home"></i>Ana Sayfa</Link></li>
                                    <li><span className="icon-right-arrow-1"></span></li>
                                    <li>Açık Rıza Metni</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Page Header End */}

                {/* Açık Rıza Content Start */}
                <section className="kvkk-content">
                    <div className="container">

                        <div className="kvkk-content__logo">
                            <img src="/assets/images/SoruYorumLogoSon.png" alt="Keypad Sistem Logo" />
                        </div>

                        <h2>KVKK Aydınlatma ve Açık Rıza Metni</h2>
                        <p className="kvkk-subtitle"><Link href="/kvkk">Detaylı KVKK Aydınlatma Metni&apos;ni görüntüle →</Link></p>

                        <p>Keypad Sistem İletişim Bilişim Turizm Organizasyon Ticaret Limited Şirketi (&quot;Şirket&quot;) tarafından sunulan interaktif oylama, soru-cevap, tombala ve etkinlik yönetim sistemleri kapsamında, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verilerinizin işlenmesine ilişkin açık rızanızı talep etmekteyiz.</p>

                        {/* 1. Veri Sorumlusu */}
                        <h3>1. Veri Sorumlusu</h3>
                        <div className="info-block">
                            <p><strong>Ticaret Unvanı:</strong> Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.</p>
                            <p><strong>Adres:</strong> Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul</p>
                            <p><strong>Telefon:</strong> +90 212 503 39 39</p>
                            <p><strong>E-posta:</strong> <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a></p>
                        </div>

                        {/* 2. İşlenen Kişisel Veriler */}
                        <h3>2. İşlenen Kişisel Veriler</h3>
                        <ul>
                            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                            <li><strong>Dijital Veriler:</strong> IP adresi, cihaz bilgileri, oturum bilgileri, cihaz parmak izi</li>
                            <li><strong>Etkinlik Verileri:</strong> Sorular, oylar, cevaplar ve diğer etkinlik içi aktiviteler</li>
                        </ul>

                        {/* 3. İşleme Amaçları */}
                        <h3>3. İşleme Amaçları</h3>
                        <ul>
                            <li>Etkinliğe (oylama, soru-cevap, tombala vb.) katılım sağlanması</li>
                            <li>Kullanıcı kimliğinin doğrulanması ve güvenliğin sağlanması</li>
                            <li>Etkinlik istatistiklerinin tutulması ve raporlanması</li>
                            <li>Etkinlik organizatörü ile veri paylaşımı (etkinlik kapsamında toplanan tüm veriler)</li>
                        </ul>

                        {/* 4. Veri Paylaşımı ve Saklama */}
                        <h3>4. Veri Paylaşımı ve Saklama</h3>
                        <p>Etkinlik sırasında girdiğiniz tüm kişisel bilgiler ve aktiviteleriniz (ad, soyad, e-posta, telefon, sorular, oylar, cevaplar), etkinliği düzenleyen organizatör firma ile paylaşılacaktır.</p>
                        <p>Etkinlik sonrası veriler raporlanarak organizatöre teslim edilir ve <strong>en geç 1 hafta içinde</strong> Şirket sistemlerinden tamamen silinir.</p>

                        {/* Önemli Bilgilendirme */}
                        <div className="highlight-block">
                            <h3 style={{ marginTop: 0 }}>Önemli Bilgilendirme</h3>
                            <p>Bu sisteme kaydolarak ve etkinliğe katılarak;</p>
                            <ul>
                                <li>Kişisel verilerinizin yukarıda belirtilen amaçlarla işleneceğini,</li>
                                <li>Verilerinizin etkinlik organizatörü ile paylaşılacağını,</li>
                                <li>Etkinlik sonrası 1 hafta içinde verilerinizin Şirket sistemlerinden silineceğini,</li>
                                <li>Tombala oyunlarının sadece eğlence amaçlı olduğunu, bahis/şans oyunu olmadığını,</li>
                                <li>KVKK kapsamındaki haklarınızı kullanabileceğinizi</li>
                            </ul>
                            <p><strong>kabul etmiş olursunuz.</strong></p>
                        </div>

                        {/* 5. Açık Rıza Beyanı */}
                        <h3>5. Açık Rıza Beyanı</h3>
                        <div className="consent-block">
                            <p>Yukarıda belirtilen kişisel verilerimin;</p>
                            <ul style={{ marginTop: '15px' }}>
                                <li style={{ color: 'var(--techguru-white)' }}>Etkinlik kapsamında işlenmesine,</li>
                                <li style={{ color: 'var(--techguru-white)' }}>Etkinlik organizatörü ile paylaşılmasına,</li>
                                <li style={{ color: 'var(--techguru-white)' }}>Etkinlik sonrası 1 hafta içinde Şirket sistemlerinden silinmesine,</li>
                                <li style={{ color: 'var(--techguru-white)' }}>KVKK Aydınlatma Metni&apos;nde belirtilen şartlar çerçevesinde saklanmasına</li>
                            </ul>
                            <p style={{ marginTop: '20px', fontSize: '18px', fontWeight: 700, color: 'var(--techguru-base)' }}>Özgür iradem ile, bilgilendirilmiş olarak AÇIK RIZA VERİYORUM.</p>
                        </div>

                        {/* 6. KVKK Kapsamındaki Haklarınız */}
                        <h3>6. KVKK Kapsamındaki Haklarınız</h3>
                        <p>KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
                        <ul>
                            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                            <li>İşlenmişse bilgi talep etme</li>
                            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                            <li>Yurt içi/dışı aktarılan üçüncü kişileri bilme</li>
                            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
                            <li>Silinmesini veya yok edilmesini talep etme</li>
                            <li>İşlenen verilerin otomatik sistemlerle analiz edilmesine itiraz etme</li>
                            <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
                        </ul>
                        <p>Bu haklarınızı kullanmak için <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a> adresine veya aşağıdaki adrese yazılı olarak başvurabilirsiniz.</p>

                        <div className="info-block">
                            <p><strong>Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.</strong></p>
                            <p><strong>Adres:</strong> Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul</p>
                            <p><strong>Telefon:</strong> +90 212 503 39 39</p>
                            <p><strong>E-posta:</strong> <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a></p>
                        </div>
                        <p>Başvurularınız, KVKK ve ilgili mevzuat çerçevesinde değerlendirilerek en geç 30 gün içinde cevaplanır.</p>

                        <p style={{ marginTop: '40px', fontStyle: 'italic', color: 'var(--techguru-gray)' }}>Bu metin, Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti. tarafından hazırlanmıştır.</p>

                    </div>
                </section>
                {/* Açık Rıza Content End */}

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
                                <p className="newsletter-two__text">Ürün güncellemeleri ve duyuruları e-posta kutunuza gelsin.</p>
                            </div>
                            <div className="newsletter-two__right">
                                <form className="newsletter-two__form">
                                    <div className="newsletter-two__input">
                                        <input type="email" name="email" placeholder="E-posta adresinizi girin" required />
                                    </div>
                                    <button type="submit" className="thm-btn">Şimdi Abone Ol <span className="icon-right-arrow"></span>
                                    </button>
                                    <div className="checked-box">
                                        <input type="checkbox" name="skipper1" id="skipper" defaultChecked={true} />
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

            </div>

            {/* Mobile Nav */}
            <div className="mobile-nav__wrapper">
                <div className="mobile-nav__overlay mobile-nav__toggler"></div>
                <div className="mobile-nav__content">
                    <span className="mobile-nav__close mobile-nav__toggler"><i className="fa fa-times"></i></span>

                    <div className="logo-box">
                        <Link href="/" aria-label="logo image"><img src="/assets/images/SoruYorumLogoSon.png" width="200" alt="SoruYorum" /></Link>
                    </div>
                    <div className="mobile-nav__container"></div>

                    <ul className="mobile-nav__contact list-unstyled">
                        <li>
                            <i className="fa fa-envelope"></i>
                            <a href="mailto:info@soruyorum.online">info@soruyorum.online</a>
                        </li>
                        <li>
                            <i className="fas fa-phone"></i>
                            <a href="tel:+902125033939">+90 (212) 503 39 39</a>
                        </li>
                    </ul>
                    <div className="mobile-nav__top">
                        <div className="mobile-nav__social">
                            <a href="#" className="fab fa-twitter"></a>
                            <a href="#" className="fab fa-facebook-square"></a>
                            <a href="#" className="fab fa-pinterest-p"></a>
                            <a href="#" className="fab fa-instagram"></a>
                        </div>
                    </div>
                </div>
            </div>

            <a href="#" data-target="html" className="scroll-to-target scroll-to-top">
                <span className="scroll-to-top__wrapper"><span className="scroll-to-top__inner"></span></span>
                <span className="scroll-to-top__text"> Yukarıya geri dön</span>
            </a>


        </>
    );
}
