export function MarketingLandingNewsletter() {
    return (
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
                        <p className="newsletter-two__text">
                            En yeni SEO ipuçlarını ve yazılım içgörülerini doğrudan gelen kutunuza alın.
                        </p>
                    </div>
                    <div className="newsletter-two__right">
                        <form className="newsletter-two__form">
                            <div className="newsletter-two__input">
                                <input type="email" name="email" placeholder="E-posta adresinizi girin" required />
                            </div>
                            <button type="submit" className="thm-btn">
                                Şimdi Abone Ol <span className="icon-right-arrow"></span>
                            </button>
                            <div className="checked-box">
                                <input type="checkbox" name="skipper1" id="skipper" defaultChecked />
                                <label htmlFor="skipper">
                                    <span></span>Abone olarak Gizlilik Politikamızı kabul etmiş olursunuz.
                                </label>
                            </div>
                            <div className="result"></div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
