"use client";

import { useEffect, useState } from "react";
import { Logo } from "@ks-interaktif/ui";

interface AuthPageShellProps {
    title: string;
    children: React.ReactNode;
}

export function AuthPageShell({ title, children }: AuthPageShellProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* Override root-layout body colours for auth pages */
    useEffect(() => {
        const body = document.body;
        body.style.backgroundColor = "#fff";
        body.style.color = "#333";
        return () => {
            body.style.backgroundColor = "";
            body.style.color = "";
        };
    }, []);

    /* Mobile-menu body class (template CSS uses it) */
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.classList.add("mobile-menu-visible");
        } else {
            document.body.classList.remove("mobile-menu-visible");
        }
    }, [mobileMenuOpen]);

    return (
        <div className="page-wrapper">
            {/* ── Header ─────────────────────────────────── */}
            <header className="main-header-two">
                <div className="main-menu-two__top">
                    <div className="main-menu-two__top-inner">
                        <p className="main-menu-two__top-text">
                            SoruYorum.Online ile etkinliklerinizi gerçek zamanlı etkileşimle
                            güçlendirin.
                        </p>
                        <ul className="list-unstyled main-menu-two__contact-list">
                            <li>
                                <div className="icon">
                                    <i className="icon-pin"></i>
                                </div>
                                <div className="text">
                                    <p>
                                        İstanbul, Kavacık Mh., Fatih Sultan Mehmet Cd. Tonoğlu
                                        Plaza No:3 Kat:4, Beykoz/İstanbul
                                    </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                    <i className="icon-search-mail"></i>
                                </div>
                                <div className="text">
                                    <p>
                                        <a href="mailto:info@soruyorum.online">
                                            info@soruyorum.online
                                        </a>
                                    </p>
                                </div>
                            </li>
                            <li>
                                <div className="icon">
                                    <i className="icon-phone-call"></i>
                                </div>
                                <div className="text">
                                    <p>
                                        <a href="tel:+902125033939">+90 (212) 503 39 39</a>
                                    </p>
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
                                    <a href="/">
                                        <Logo variant="dark" size="lg" animate={false} />
                                    </a>
                                </div>
                            </div>

                            <div className="main-menu-two__main-menu-box">
                                <a
                                    href="#"
                                    className="mobile-nav__toggler"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setMobileMenuOpen(true);
                                    }}
                                >
                                    <i className="fa fa-bars"></i>
                                </a>
                                <ul className="main-menu__list one-page-scroll-menu">
                                    <li className="scrollToLink">
                                        <a href="/#home">AnaSayfa</a>
                                    </li>
                                    <li className="scrollToLink">
                                        <a href="/#about">Hakkımızda</a>
                                    </li>
                                    <li>
                                        <a href="/plans-preview">Fiyatlandırma</a>
                                    </li>
                                    <li className="scrollToLink">
                                        <a href="/#services">Kullanım Alanları</a>
                                    </li>
                                    <li className="scrollToLink">
                                        <a href="/#use-cases">Neden Soru-Yorum</a>
                                    </li>
                                    <li className="scrollToLink">
                                        <a href="/#how-it-works">Nasıl Çalışır</a>
                                    </li>
                                    <li className="scrollToLink">
                                        <a href="/#contact">İletişim</a>
                                    </li>
                                </ul>
                            </div>

                            <div className="main-menu-two__right">
                                <div className="main-menu-two__btn-box">
                                    <a href="/register" className="thm-btn">
                                        Kayıt
                                        <span className="icon-right-arrow"></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Sticky header placeholder (template CSS expects this node) */}
            <div className="stricky-header stricked-menu main-menu main-menu-two">
                <div className="sticky-header__content"></div>
            </div>

            {/* ── Page Header / Banner ───────────────────── */}
            <section className="page-header">
                <div
                    className="page-header__bg"
                    style={{
                        backgroundImage:
                            "url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/48ca798a-012e-496c-720b-b4a2767c0900/soruyorum)",
                    }}
                ></div>
                <div className="container">
                    <div className="page-header__inner">
                        <h2>{title}</h2>
                        <div className="thm-breadcrumb__box">
                            <ul className="thm-breadcrumb list-unstyled">
                                <li>
                                    <a href="/">
                                        <i className="fas fa-home"></i>Ana Sayfa
                                    </a>
                                </li>
                                <li>
                                    <span className="icon-right-arrow-1"></span>
                                </li>
                                <li>{title}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Main Content (form section injected by page) ── */}
            {children}

            {/* ── Newsletter ─────────────────────────────── */}
            <section className="newsletter-two">
                <div className="newsletter-two__shape-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/assets/images/shapes/newsletter-two-shape-1.png"
                        alt=""
                    />
                </div>
                <div className="newsletter-two__shape-2 float-bob-x">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/assets/images/shapes/newsletter-two-shape-2.png"
                        alt=""
                    />
                </div>
                <div className="container">
                    <div className="newsletter-two__inner">
                        <div className="newsletter-two__left">
                            <h2 className="newsletter-two__title">
                                Bültenimize Abone Olun
                            </h2>
                            <p className="newsletter-two__text">
                                Ürün güncellemeleri ve duyuruları e-posta kutunuza gelsin.
                            </p>
                        </div>
                        <div className="newsletter-two__right">
                            <form
                                className="newsletter-two__form"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <div className="newsletter-two__input">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="E-posta adresinizi girin"
                                        required
                                    />
                                </div>
                                <button type="submit" className="thm-btn">
                                    Şimdi Abone Ol{" "}
                                    <span className="icon-right-arrow"></span>
                                </button>
                                <div className="checked-box">
                                    <input
                                        type="checkbox"
                                        name="skipper1"
                                        id="skipper"
                                        defaultChecked
                                    />
                                    <label htmlFor="skipper">
                                        <span></span>Abone olarak Gizlilik
                                        Politikamızı kabul etmiş olursunuz.
                                    </label>
                                </div>
                                <div className="result"></div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────── */}
            <footer className="site-footer-two">
                <div className="site-footer-two__bottom">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-12">
                                <div className="site-footer-two__bottom-inner text-center">
                                    <div className="site-footer-two__copyright">
                                        <p className="site-footer-two__copyright-text">
                                            © 2026 Soru-Yorum. Tüm hakları{" "}
                                            <a href="https://www.keypadsistem.com">
                                                Keypad Sistem İletişim Bilişim Turz. Tic. Ltd.
                                                Şti.
                                            </a>{" "}
                                            tarafından saklıdır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── Mobile Nav ─────────────────────────────── */}
            <div className="mobile-nav__wrapper">
                <div
                    className="mobile-nav__overlay mobile-nav__toggler"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
                <div className="mobile-nav__content">
                    <span
                        className="mobile-nav__close mobile-nav__toggler"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <i className="fa fa-times"></i>
                    </span>

                    <div className="logo-box">
                        <a href="/" aria-label="logo image">
                            <Logo variant="dark" size="lg" animate={false} />
                        </a>
                    </div>

                    <div className="mobile-nav__container">
                        <ul className="main-menu__list" style={{ display: "block" }}>
                            <li>
                                <a href="/">AnaSayfa</a>
                            </li>
                            <li>
                                <a href="/#about">Hakkımızda</a>
                            </li>
                            <li>
                                <a href="/plans-preview">Fiyatlandırma</a>
                            </li>
                            <li>
                                <a href="/#services">Kullanım Alanları</a>
                            </li>
                            <li>
                                <a href="/#use-cases">Neden Soru-Yorum</a>
                            </li>
                            <li>
                                <a href="/#how-it-works">Nasıl Çalışır</a>
                            </li>
                            <li>
                                <a href="/#contact">İletişim</a>
                            </li>
                        </ul>
                    </div>

                    <ul className="mobile-nav__contact list-unstyled">
                        <li>
                            <i className="fa fa-envelope"></i>
                            <a href="mailto:info@soruyorum.online">
                                info@soruyorum.online
                            </a>
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
        </div>
    );
}
