export function MarketingLandingProcess() {
    return (
        <section className="process-two" id="how-it-works">
            <div
                className="process-two__bg"
                style={{
                    backgroundImage:
                        "url(https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/c2a9fd68-140c-4513-d868-7129c5e76400/soruyorum)",
                }}
            ></div>
            <div
                className="process-two__bg-shape float-bob-y"
                style={{ backgroundImage: "url(/assets/images/shapes/process-two-bg-shape.png)" }}
            ></div>
            <div className="container">
                <div className="section-title text-center sec-title-animation animation-style1">
                    <div className="section-title__tagline-box">
                        <div className="section-title__tagline-shape-1"></div>
                        <span className="section-title__tagline">Nasıl Çalışır?</span>
                        <div className="section-title__tagline-shape-2"></div>
                    </div>
                    <h2 className="section-title__title title-animation">
                        3 Basit Adımda <br />
                        <span>Etkileşimli Sunumlarınıza Başlayın</span>
                    </h2>
                </div>
                <ul className="row list-unstyled">
                    <li className="col-xl-4 col-lg-4">
                        <div className="process-two__single">
                            <div className="process-two__count"></div>
                            <h3 className="process-two__title">Sunum Oluştur</h3>
                            <p className="process-two__text">
                                Hesabınıza giriş yapın, yeni sunum
                                <br /> oluşturun ve sunum kodunu
                                <br /> alın.
                            </p>
                        </div>
                    </li>
                    <li className="col-xl-4 col-lg-4">
                        <div className="process-two__single">
                            <div className="process-two__shape-1 float-bob-x">
                                <img src="/assets/images/shapes/process-two-shape-1.png" alt="" />
                            </div>
                            <div className="process-two__shape-2 float-bob-x">
                                <img src="/assets/images/shapes/process-two-shape-2.png" alt="" />
                            </div>
                            <div className="process-two__count"></div>
                            <h3 className="process-two__title">QR Kod Paylaş</h3>
                            <p className="process-two__text">
                                QR kodunu ekranda gösterin veya
                                <br /> sunum kodunu katılımcılarla
                                <br /> paylaşın.
                            </p>
                        </div>
                    </li>
                    <li className="col-xl-4 col-lg-4">
                        <div className="process-two__single">
                            <div className="process-two__count"></div>
                            <h3 className="process-two__title">Soruları Yönet</h3>
                            <p className="process-two__text">
                                Gelen soruları moderasyon panelinden
                                <br /> yönetin ve canlı ekranda
                                <br /> görüntüleyin.
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
        </section>
    );
}
