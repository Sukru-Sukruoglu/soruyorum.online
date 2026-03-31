"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { trpc } from "../../../utils/trpc";
import { PreloaderDismissal } from "../../../components/PreloaderDismissal";

export default function ForgotPasswordClient() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"email" | "success">("email");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
        onSuccess: () => {
            setLoading(false);
            setStep("success");
            setErrorMessage(null);
        },
        onError: (err) => {
            setLoading(false);
            setErrorMessage(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!email) {
            setErrorMessage("Lütfen e-posta adresinizi girin.");
            return;
        }

        setLoading(true);
        forgotPasswordMutation.mutate({ email });
    };

    return (
        <>
            <PreloaderDismissal />


            {/* Preloader Div - Handled by PreloaderDismissal */}
            <div className="loader js-preloader" suppressHydrationWarning>
                <div></div>
                <div></div>
                <div></div>
            </div>

            {/* Sidebar Widget Content */}
            <div className="xs-sidebar-group info-group info-sidebar">
                <div className="xs-overlay xs-bg-black"></div>
                <div className="xs-sidebar-widget">
                    <div className="sidebar-widget-container">
                        <div className="widget-heading">
                            <a href="#" className="close-side-widget">X</a>
                        </div>
                        <div className="sidebar-textwidget">
                            <div className="sidebar-info-contents">
                                <div className="content-inner">
                                    <div className="logo">
                                        <Link href="/"><img src="/assets/images/SoruYorumLogoSon.png" alt="SoruYorum" width="200" /></Link>
                                    </div>
                                    <div className="content-box">
                                        <h4>Hakkımızda</h4>
                                        <p>SoruYorum.Online ile etkinliklerinizi etkileşimli hale getirin. Canlı soru-cevap, geri bildirim ve moderasyon paneli ile katılımcı etkileşimini güçlendirin.</p>
                                    </div>
                                    <div className="form-inner">
                                        <h4>Hızlı İletişim</h4>
                                        <form action="/assets/inc/sendemail.php" className="contact-form-validated" noValidate>
                                            <div className="form-group">
                                                <input type="text" name="name" placeholder="Ad Soyad" required />
                                            </div>
                                            <div className="form-group">
                                                <input type="email" name="email" placeholder="E-posta" required />
                                            </div>
                                            <div className="form-group">
                                                <textarea name="message" placeholder="Mesajınız..."></textarea>
                                            </div>
                                            <div className="form-group message-btn">
                                                <button type="submit" className="thm-btn form-inner__btn">Gönder<span className="icon-right-arrow"></span></button>
                                            </div>
                                        </form>
                                        <div className="result"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-wrapper">
                <header className="main-header-two">
                    <div className="main-menu-two__top">
                        <div className="main-menu-two__top-inner">
                            <p className="main-menu-two__top-text">SoruYorum.Online ile etkinliklerinizi gerçek zamanlı etkileşimle güçlendirin.</p>
                            <ul className="list-unstyled main-menu-two__contact-list">
                                <li>
                                    <div className="icon">
                                        <i className="icon-pin"></i>
                                    </div>
                                    <div className="text">
                                        <p>İstanbul, Kavacık Mh., Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, Beykoz/İstanbul</p>
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
                                        <Link href="/"><img src="/assets/images/SoruYorumLogoSon.png" alt="SoruYorum" width="200" /></Link>
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
                                    <div className="main-menu-two__btn-box">
                                        <Link href="/register" className="thm-btn">Kayıt<span className="icon-right-arrow"></span></Link>
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
                            <h2>Şifremi Unuttum</h2>
                            <div className="thm-breadcrumb__box">
                                <ul className="thm-breadcrumb list-unstyled">
                                    <li><Link href="/"><i className="fas fa-home"></i>Ana Sayfa</Link></li>
                                    <li><span className="icon-right-arrow-1"></span></li>
                                    <li><Link href="/login">Giriş Yap</Link></li>
                                    <li><span className="icon-right-arrow-1"></span></li>
                                    <li>Şifremi Unuttum</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Page Header End */}

                {/* Start Forgot Password */}
                <section className="login-one">
                    <div className="container">
                        <div className="login-one__form">
                            {/* Step 1: Email Form */}
                            {step === "email" && (
                                <div id="step-email">
                                    <div className="inner-title text-center">
                                        <h2>Şifremi Unuttum</h2>
                                        <p style={{ color: '#aaa', marginTop: '8px', fontSize: '15px' }}>Hesabınıza kayıtlı e-posta adresini girin, size şifre sıfırlama bağlantısı gönderelim.</p>
                                    </div>
                                    <form id="forgot-password-form" onSubmit={handleSubmit}>
                                        {errorMessage && (
                                            <div
                                                style={{
                                                    display: "block",
                                                    padding: "12px 16px",
                                                    borderRadius: "8px",
                                                    marginBottom: "16px",
                                                    fontSize: "14px",
                                                    background: "rgba(239,68,68,0.15)",
                                                    color: "#ef4444",
                                                    border: "1px solid rgba(239,68,68,0.3)"
                                                }}
                                            >
                                                {errorMessage}
                                            </div>
                                        )}
                                        <div className="row">
                                            <div className="col-xl-12">
                                                <div className="form-group">
                                                    <div className="input-box">
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            id="forgot-email"
                                                            placeholder="E-posta Adresi"
                                                            required
                                                            autoComplete="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-12">
                                                <div className="form-group">
                                                    <button className="thm-btn" type="submit" id="forgot-btn" disabled={loading}>
                                                        {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                                                        <span className="icon-right-arrow"></span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="create-account text-center">
                                                <p><Link href="/login"><i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>Giriş sayfasına dön</Link></p>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Step 2: Success Message */}
                            {step === "success" && (
                                <div id="step-success">
                                    <div className="inner-title text-center">
                                        <div style={{ marginBottom: '20px' }}>
                                            <i className="fas fa-envelope-open-text" style={{ fontSize: '48px', color: '#22c55e' }}></i>
                                        </div>
                                        <h2>E-postanızı Kontrol Edin</h2>
                                        <p style={{ color: '#aaa', marginTop: '12px', fontSize: '15px', lineHeight: 1.6 }} id="success-message">
                                            Eğer <strong>{email}</strong> adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.
                                        </p>
                                    </div>
                                    <div className="row" style={{ marginTop: '24px' }}>
                                        <div className="col-xl-12">
                                            <div className="form-group">
                                                <Link href="/login" className="thm-btn" style={{ display: 'block', textAlign: 'center' }}>Giriş Sayfasına Dön
                                                    <span className="icon-right-arrow"></span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                {/* End Forgot Password */}

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
                                <form className="newsletter-two__form" onSubmit={(e) => e.preventDefault()}>
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
