"use client";

import Script from "next/script";
import Link from "next/link";
import { PreloaderDismissal } from "../../../components/PreloaderDismissal";

// Client component for smooth scrolling
const SmoothScrollLink = () => {
    const scrollToAcikRiza = () => {
        const element = document.getElementById('acik-riza');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <p className="kvkk-subtitle" onClick={scrollToAcikRiza}>
            Açık Rıza Metni'ni görüntüle ↓
        </p>
    );
};

export default function KvkkPage() {
    return (
        <>
            <PreloaderDismissal />
            {/* New CSS for KVKK */}
            <link rel="stylesheet" href="/assets/css/module-css/kvkk.css" />

            {/* New CSS for KVKK */}
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
                            <h2>KVKK Aydınlatma Metni</h2>
                            <div className="thm-breadcrumb__box">
                                <ul className="thm-breadcrumb list-unstyled">
                                    <li><Link href="/"><i className="fas fa-home"></i>Ana Sayfa</Link></li>
                                    <li><span className="icon-right-arrow-1"></span></li>
                                    <li>KVKK Aydınlatma Metni</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Page Header End */}

                {/* KVKK Content Start */}
                <section className="kvkk-content">
                    <div className="container">

                        <div className="kvkk-content__logo">
                            <img src="/assets/images/SoruYorumLogoSon.png" alt="Keypad Sistem Logo" />
                        </div>

                        <h2>Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni</h2>

                        <SmoothScrollLink />

                        <p>Keypad Sistem İletişim Bilişim Turizm Organizasyon Ticaret Limited Şirketi olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında kişisel verilerinizi aşağıda açıklanan çerçevede işlemekteyiz.</p>

                        {/* 1. Veri Sorumlusu */}
                        <h3>1. Veri Sorumlusu</h3>
                        <div className="info-block">
                            <p><strong>Ticaret Unvanı:</strong> Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.</p>
                            <p><strong>Adres:</strong> Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul</p>
                            <p><strong>Telefon:</strong> +90 212 503 39 39</p>
                            <p><strong>E-posta:</strong> <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a></p>
                        </div>

                        {/* 2. İşlenen Kişisel Verileriniz */}
                        <h3>2. İşlenen Kişisel Verileriniz ve Toplama Yöntemleri</h3>
                        <p>Şirketimiz tarafından işlenen kişisel verileriniz şunlardır:</p>
                        <ul>
                            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                            <li><strong>İş Bilgileri:</strong> Firma adı, unvan (teklif talepleri için)</li>
                            <li><strong>Dijital Veriler:</strong> IP adresi, çerezler, oturum bilgileri, cihaz parmak izi (fingerprint)</li>
                        </ul>

                        <p><strong>Kişisel Verilerinizin Toplanma Yöntemleri:</strong></p>
                        <p>Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
                        <ul>
                            <li>Mobil ve masaüstü web formları (mobil.soruyorum.online, sorucevap.online, cevap.live vb.)</li>
                            <li>PIN kodu ile giriş sistemi</li>
                            <li>QR kod tarama</li>
                            <li>E-posta (web sitelerimiz üzerinden gönderilen teklif ve iletişim formları)</li>
                            <li>KVKK onayı: Tüm kayıt işlemlerinde açık rıza onayınız tarih ve saat bilgisi ile birlikte kaydedilir</li>
                        </ul>

                        <h3>2.1. Kişisel Verilerin İşlenme Hukuki Dayanağı</h3>
                        <p>Kişisel verileriniz, KVKK&apos;nın 5. ve 6. maddelerine uygun olarak aşağıdaki hukuki dayanaklara göre işlenmektedir:</p>
                        <ul>
                            <li><strong>Açık Rıza:</strong> Etkinlik kayıt formunda &quot;KVKK Aydınlatma ve Açık Rıza Metni&quot;ni onaylayarak kişisel verilerinizin işlenmesine ve etkinlik organizatörü ile paylaşılmasına açık rıza vermiş olursunuz. Bu onayınız tarih ve saat bilgisi ile birlikte kaydedilir.</li>
                            <li><strong>Sözleşmenin İfası:</strong> Müşteri firmalarımızla yapılan hizmet sözleşmelerinin yerine getirilmesi amacıyla verileriniz işlenir.</li>
                        </ul>

                        {/* 3. İşlenme Amaçları */}
                        <h3>3. Kişisel Verilerin İşlenme Amaçları</h3>
                        <p>Kişisel verileriniz, KVKK&apos;nın 5. ve 6. maddelerine uygun olarak şu amaçlarla işlenmektedir:</p>
                        <ul>
                            <li>Müşteri kayıt süreçlerinin yürütülmesi</li>
                            <li>Müşteri bilgilendirme hizmetlerinin sunulması</li>
                            <li>Teklif taleplerinin alınması, değerlendirilmesi ve müşterilere sunulması</li>
                            <li>E-posta doğrulama ve onay süreçlerinin yürütülmesi</li>
                            <li>Etkinlik ve oylama sistemlerinin işletilmesi</li>
                            <li>Firmalara özel yazılım projelerinde kimlik doğrulama ve güvenlik önlemleri alınması</li>
                            <li>Raporlama ve istatistiksel analizlerin gerçekleştirilmesi</li>
                        </ul>

                        {/* 4. Paylaşım */}
                        <h3>4. Kişisel Verilerin Kimlerle ve Hangi Amaçla Paylaşılabileceği</h3>
                        <p><strong>Müşteri Firmalarla Paylaşım:</strong></p>
                        <p>Şirketimizin sunduğu interaktif oylama, soru-cevap ve etkinlik yönetim sistemlerini kullanan kurumsal müşteriler, kendi etkinliklerinde toplanan verilere erişim sağlar. Bir etkinliğe katıldığınızda girdiğiniz kişisel bilgiler (ad, soyad, e-posta, telefon) ve etkinlik sırasındaki aktiviteleriniz (sorular, oylar, cevaplar) etkinliği düzenleyen müşteri firma ile paylaşılır.</p>
                        <p>Etkinlik sonrası tüm katılımcı verileri raporlanarak müşteriye teslim edilir ve en geç 1 hafta içerisinde sistemlerimizden tamamen silinir.</p>

                        <p><strong>Yasal Yükümlülükler:</strong></p>
                        <p>Kişisel verileriniz, yasal zorunluluk halinde yetkili adli ve idari makamlara aktarılabilir.</p>

                        <p><strong>Veri Güvenliği:</strong></p>
                        <p>Tüm veriler kendi sunucularımızda güvenli şekilde saklanır ve işlenir. Belirtilen durumlar dışında hiçbir üçüncü taraf ile paylaşım yapılmaz.</p>

                        {/* 5. Saklanma Süresi */}
                        <h3>5. Kişisel Verilerin Saklanma Süresi</h3>
                        <p>Kişisel verileriniz, toplama amacına uygun olarak aşağıdaki süreler boyunca saklanmaktadır:</p>
                        <ul>
                            <li><strong>Etkinlik katılımcı verileri:</strong> Etkinlik sonrası raporlama tamamlandıktan sonra en geç 1 hafta içinde silinir.</li>
                            <li><strong>Teklif talep verileri:</strong> Ticari kayıt ve müşteri ilişkileri yönetimi amacıyla, Türk Ticaret Kanunu ve Vergi Usul Kanunu&apos;nun gerektirdiği süreler boyunca (en fazla 10 yıl) saklanır.</li>
                            <li><strong>Müşteri sözleşme verileri:</strong> Sözleşme süresi boyunca ve sözleşme sonrası yasal zamanaşımı süreleri (en fazla 10 yıl) kadar saklanır.</li>
                            <li><strong>KVKK onay kayıtları:</strong> İspat yükümlülüğü nedeniyle yasal zamanaşımı süreleri boyunca saklanır.</li>
                        </ul>

                        {/* 6. Haklar */}
                        <h3>6. KVKK Kapsamındaki Haklarınız</h3>
                        <p>KVKK&apos;nın 11. maddesi uyarınca, aşağıdaki haklara sahipsiniz:</p>
                        <ul>
                            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                            <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                            <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                            <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde verilerin silinmesini veya yok edilmesini talep etme</li>
                            <li>Düzeltme, silme ve yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                            <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                        </ul>

                        {/* 7. Başvurular */}
                        <h3>7. KVKK ile İlgili Başvurular</h3>
                        <p>KVKK ile ilgili taleplerinizi <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a> adresine e-posta göndererek ya da aşağıdaki adrese yazılı olarak iletebilirsiniz.</p>
                        <div className="info-block">
                            <p><strong>Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.</strong></p>
                            <p><strong>Adres:</strong> Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul</p>
                            <p><strong>Telefon:</strong> +90 212 503 39 39</p>
                            <p><strong>E-posta:</strong> <a href="mailto:bilgi@keypadsistem.com" style={{ color: 'var(--techguru-base)' }}>bilgi@keypadsistem.com</a></p>
                        </div>
                        <p>Başvurularınız, KVKK ve ilgili mevzuat çerçevesinde değerlendirilerek mümkün olan en kısa sürede ve en geç 30 (otuz) gün içinde sonuçlandırılır.</p>

                        <p style={{ marginTop: '40px', fontStyle: 'italic', color: 'var(--techguru-gray)' }}>Bu metin, Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti. tarafından hazırlanmıştır.</p>

                        {/* Açık Rıza Metni Bölümü */}
                        <div id="acik-riza" style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h2>Açık Rıza Metni</h2>
                            <p>Keypad Sistem İletişim Bilişim Turizm Organizasyon Ticaret Limited Şirketi tarafından yukarıda yer alan KVKK Aydınlatma Metni kapsamında kişisel verilerimin işlenmesine, saklanmasına ve etkinlik organizatörü ile paylaşılmasına özgür iradem ile açık rıza veriyorum.</p>
                        </div>

                    </div>
                </section>
                {/* KVKK Content End */}

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
