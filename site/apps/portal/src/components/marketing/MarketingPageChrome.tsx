import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@ks-interaktif/ui";
import { PreloaderDismissal } from "@/components/PreloaderDismissal";

/** Ortak pazarlama sayfası kabuğu: preloader, yan panel, page-wrapper, mobil menü. */
export function MarketingPageChrome({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      <PreloaderDismissal />

      <div className="loader js-preloader" suppressHydrationWarning>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div className="xs-sidebar-group info-group info-sidebar">
        <div className="xs-overlay xs-bg-black"></div>
        <div className="xs-sidebar-widget">
          <div className="sidebar-widget-container">
            <div className="widget-heading">
              <a href="#" className="close-side-widget">
                X
              </a>
            </div>
            <div className="sidebar-textwidget">
              <div className="sidebar-info-contents">
                <div className="content-inner">
                  <div className="logo">
                    <Link href="/">
                      <Logo variant="dark" size="lg" animate={false} />
                    </Link>
                  </div>
                  <div className="content-box">
                    <h4>Hakkımızda</h4>
                    <p>
                      SoruYorum.Online ile etkinliklerinizi daha etkileşimli hale getirin.
                      Sorularınızı toplayın, oylayın ve canlı olarak yanıtlayın.
                    </p>
                  </div>
                  <div className="form-inner">
                    <h4>İletişim</h4>
                    <form
                      action="/assets/inc/sendemail.php"
                      className="contact-form-validated"
                      noValidate
                    >
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
                        <button type="submit" className="thm-btn form-inner__btn">
                          Gönder<span className="icon-right-arrow"></span>
                        </button>
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

      <div className="page-wrapper" suppressHydrationWarning>
        {children}
      </div>

      <div className="mobile-nav__wrapper" suppressHydrationWarning>
        <div className="mobile-nav__overlay mobile-nav__toggler"></div>
        <div className="mobile-nav__content">
          <span className="mobile-nav__close mobile-nav__toggler">
            <i className="fa fa-times"></i>
          </span>
          <div className="logo-box">
            <Link href="/" aria-label="logo image">
              <Logo variant="dark" size="md" animate={false} />
            </Link>
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

      <div className="search-popup">
        <div className="color-layer"></div>
        <button className="close-search">
          <span className="far fa-times fa-fw"></span>
        </button>
        <form method="post" action="blog.html">
          <div className="form-group">
            <input type="search" name="search-field" placeholder="Search Here" required />
            <button type="submit">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>
      </div>

      <a
        href="#"
        data-target="html"
        className="scroll-to-target scroll-to-top"
        suppressHydrationWarning
      >
        <span className="scroll-to-top__wrapper">
          <span className="scroll-to-top__inner"></span>
        </span>
        <span className="scroll-to-top__text"> Yukarıya geri dön</span>
      </a>
    </div>
  );
}
