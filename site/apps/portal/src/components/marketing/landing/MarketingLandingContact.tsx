export function MarketingLandingContact() {
    return (
        <section className="contact-two" id="contact">
            <ul className="contact-two__sliding-text-list list-unstyled marquee_mode-2">
                <li>
                    <h2 data-hover="Branding" className="contact-two__sliding-text-title">
                        İLETİŞİM İÇİN *
                    </h2>
                </li>
                <li>
                    <h2 data-hover="Branding" className="contact-two__sliding-text-title">
                        İLETİŞİM İÇİN *
                    </h2>
                </li>
                <li>
                    <h2 data-hover="Branding" className="contact-two__sliding-text-title">
                        İLETİŞİM İÇİN *
                    </h2>
                </li>
            </ul>

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
                                <h2 className="section-title__title title-animation">
                                    Bizimle <span>İletişime</span>
                                    <br />
                                    <span>Geçin</span>
                                </h2>
                            </div>
                            <p className="contact-two__text">Sorularınız ve talepleriniz için bizimle iletişime geçin.</p>
                            <ul className="contact-two__contact-list list-unstyled">
                                <li>
                                    <div className="icon">
                                        <span className="icon-mail"></span>
                                    </div>
                                    <div className="content">
                                        <span>E-posta</span>
                                        <p>
                                            <a href="mailto:info@soruyorum.online">info@soruyorum.online</a>
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <div className="icon">
                                        <span className="icon-phone-call"></span>
                                    </div>
                                    <div className="content">
                                        <span>Telefon</span>
                                        <p>
                                            <a href="tel:+905322268040">+90 (532) 226 80 40</a>
                                            <br />
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
                                        <p>
                                            İstanbul, Kavacık Mh., Fatih Sultan Mehmet Cd.
                                            <br />
                                            Tonoğlu Plaza No:3 Kat:4, Beykoz/İstanbul
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-xl-6">
                        <div
                            className="contact-two__right wow slideInRight"
                            data-wow-delay="100ms"
                            data-wow-duration="2500ms"
                        >
                            <form
                                className="contact-form-validated contact-one__form"
                                action="/assets/inc/sendemail.php"
                                method="post"
                                noValidate
                            >
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
                                                <select
                                                    className="selectmenu wide"
                                                    defaultValue="Konu Seçiniz"
                                                    suppressHydrationWarning
                                                >
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
                                        <button type="submit" className="thm-btn">
                                            <span>Gönder</span>
                                            <i className="icon-right-arrow"></i>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="result"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
