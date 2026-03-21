import Link from "next/link";
import { Logo } from "@ks-interaktif/ui";
import type { MarketingNavUser } from "@/lib/getMarketingNavUser";
import { PublicMarketingAuthButtons } from "./PublicMarketingAuthButtons";

type NavMode = "home" | "about";

export function MarketingMainHeader({
  navMode,
  initialNavUser,
}: {
  navMode: NavMode;
  initialNavUser: MarketingNavUser;
}) {
  const isHome = navMode === "home";

  return (
    <>
      <header className="main-header-two">
        <div className="main-menu-two__top">
          <div className="main-menu-two__top-inner">
            <p className="main-menu-two__top-text">
              SoruYorum.Online - Etkinliklerinizi İnteraktif Hale Getirin
            </p>
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
                  <p>
                    <a href="mailto:info@soruyorum.online">info@soruyorum.online</a>
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
                  <Link href="/">
                    <Logo variant="dark" size="lg" animate={false} />
                  </Link>
                </div>
              </div>
              <div className="main-menu-two__main-menu-box">
                <a href="#" className="mobile-nav__toggler">
                  <i className="fa fa-bars"></i>
                </a>
                <ul className="main-menu__list one-page-scroll-menu">
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#home">Ana Sayfa</a>
                    ) : (
                      <Link href="/#home">Ana Sayfa</Link>
                    )}
                  </li>
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#about">Hakkımızda</a>
                    ) : (
                      <Link href="/about">Hakkımızda</Link>
                    )}
                  </li>
                  <li>
                    <Link href="/plans-preview">Fiyatlandırma</Link>
                  </li>
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#services">Kullanım Alanları</a>
                    ) : (
                      <Link href="/#services">Kullanım Alanları</Link>
                    )}
                  </li>
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#use-cases">Neden Soru-Yorum</a>
                    ) : (
                      <Link href="/#use-cases">Neden Soru-Yorum</Link>
                    )}
                  </li>
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#how-it-works">Nasıl Çalışır</a>
                    ) : (
                      <Link href="/#how-it-works">Nasıl Çalışır</Link>
                    )}
                  </li>
                  <li className={isHome ? "scrollToLink" : undefined}>
                    {isHome ? (
                      <a href="#contact">İletişim</a>
                    ) : (
                      <Link href="/#contact">İletişim</Link>
                    )}
                  </li>
                </ul>
              </div>
              <div className="main-menu-two__right">
                <PublicMarketingAuthButtons initialNavUser={initialNavUser} />
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

      <div
        className="stricky-header stricked-menu main-menu main-menu-two"
        suppressHydrationWarning
      >
        <div className="sticky-header__content" suppressHydrationWarning></div>
      </div>
    </>
  );
}
