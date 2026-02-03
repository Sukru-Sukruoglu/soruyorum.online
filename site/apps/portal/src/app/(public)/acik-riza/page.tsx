export default function AcikRizaPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center justify-center mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://imagedelivery.net/prdw3ANMyocSBJD-Do1EeQ/25342331-c023-419c-d90d-bfa1ec04a500/public"
                            alt="Keypad Sistem Logo"
                            className="h-16 w-auto object-contain"
                        />
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 text-center">
                        KVKK Aydınlatma ve Açık Rıza Metni
                    </h1>

                    <div className="mt-4 flex items-center justify-center">
                        <a
                            className="text-red-600 font-semibold hover:text-red-700 underline underline-offset-2"
                            href="/kvkk"
                        >
                            Detaylı KVKK Aydınlatma Metni'ni görüntüle
                        </a>
                    </div>

                    <p className="mt-6 text-gray-700 leading-relaxed">
                        <strong>Keypad Sistem İletişim Bilişim Turizm Organizasyon Ticaret Limited Şirketi</strong> ("Şirket") tarafından
                        sunulan interaktif oylama, soru-cevap, tombala ve etkinlik yönetim sistemleri kapsamında, 6698 sayılı 
                        Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verilerinizin işlenmesine ilişkin açık rızanızı 
                        talep etmekteyiz.
                    </p>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">1. Veri Sorumlusu</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        <strong>Ticaret Unvanı:</strong> Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.
                        <br />
                        <strong>Adres:</strong> Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810
                        Beykoz/İstanbul
                        <br />
                        <strong>Telefon:</strong> +90 212 503 39 39
                        <br />
                        <strong>E-posta:</strong>{" "}
                        <a className="text-red-600 font-semibold hover:text-red-700" href="mailto:bilgi@keypadsistem.com">
                            bilgi@keypadsistem.com
                        </a>
                    </p>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">2. İşlenen Kişisel Veriler</h2>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>
                            <strong>Kimlik Bilgileri:</strong> Ad, soyad
                        </li>
                        <li>
                            <strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası
                        </li>
                        <li>
                            <strong>Dijital Veriler:</strong> IP adresi, cihaz bilgileri, oturum bilgileri, cihaz parmak izi
                        </li>
                        <li>
                            <strong>Etkinlik Verileri:</strong> Sorular, oylar, cevaplar ve diğer etkinlik içi aktiviteler
                        </li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">3. İşleme Amaçları</h2>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Etkinliğe (oylama, soru-cevap, tombala vb.) katılım sağlanması</li>
                        <li>Kullanıcı kimliğinin doğrulanması ve güvenliğin sağlanması</li>
                        <li>Etkinlik istatistiklerinin tutulması ve raporlanması</li>
                        <li>Etkinlik organizatörü ile veri paylaşımı (etkinlik kapsamında toplanan tüm veriler)</li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">4. Veri Paylaşımı ve Saklama</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Etkinlik sırasında girdiğiniz <strong>tüm kişisel bilgiler ve aktiviteleriniz</strong> (ad, soyad, e-posta, 
                        telefon, sorular, oylar, cevaplar), etkinliği düzenleyen organizatör firma ile paylaşılacaktır.
                    </p>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Etkinlik sonrası veriler raporlanarak organizatöre teslim edilir ve <strong>en geç 1 hafta içinde 
                        Şirket sistemlerinden tamamen silinir.</strong>
                    </p>

                    <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                        <h3 className="text-blue-900 font-bold">Önemli Bilgilendirme</h3>
                        <p className="mt-3 text-blue-900 leading-relaxed">
                            Bu sisteme kaydolarak ve etkinliğe katılarak;
                        </p>
                        <ul className="mt-3 list-disc pl-6 text-blue-900 space-y-1">
                            <li>Kişisel verilerinizin yukarıda belirtilen amaçlarla işleneceğini,</li>
                            <li>Verilerinizin etkinlik organizatörü ile paylaşılacağını,</li>
                            <li>Etkinlik sonrası 1 hafta içinde verilerinizin Şirket sistemlerinden silineceğini,</li>
                            <li>Tombala oyunlarının sadece eğlence amaçlı olduğunu, bahis/şans oyunu olmadığını,</li>
                            <li>KVKK kapsamındaki haklarınızı kullanabileceğinizi</li>
                        </ul>
                        <p className="mt-3 text-blue-900 leading-relaxed">kabul etmiş olursunuz.</p>
                    </div>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">5. Açık Rıza Beyanı</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Yukarıda belirtilen kişisel verilerimin;
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Etkinlik kapsamında işlenmesine,</li>
                        <li>Etkinlik organizatörü ile paylaşılmasına,</li>
                        <li>Etkinlik sonrası 1 hafta içinde Şirket sistemlerinden silinmesine,</li>
                        <li>KVKK Aydınlatma Metni'nde belirtilen şartlar çerçevesinde saklanmasına</li>
                    </ul>
                    <p className="mt-4 text-gray-900 font-bold text-lg">
                        Özgür iradem ile, bilgilendirilmiş olarak <span className="text-red-600">AÇIK RIZA VERİYORUM.</span>
                    </p>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">6. KVKK Kapsamındaki Haklarınız</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                        <li>İşlenmişse bilgi talep etme</li>
                        <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                        <li>Yurt içi/dışı aktarılan üçüncü kişileri bilme</li>
                        <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
                        <li>Silinmesini veya yok edilmesini talep etme</li>
                        <li>İşlenen verilerin otomatik sistemlerle analiz edilmesine itiraz etme</li>
                        <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
                    </ul>

                    <p className="mt-6 text-gray-700 leading-relaxed">
                        Bu haklarınızı kullanmak için{" "}
                        <a className="text-red-600 font-semibold hover:text-red-700" href="mailto:bilgi@keypadsistem.com">
                            bilgi@keypadsistem.com
                        </a>{" "}
                        adresine veya aşağıdaki adrese yazılı olarak başvurabilirsiniz.
                    </p>

                    <div className="mt-8 rounded-xl bg-slate-900 text-white p-5">
                        <div className="font-bold">Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti.</div>
                        <div className="mt-2 text-sm text-white/90">
                            Adres: Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul
                            <br />
                            Telefon: +90 212 503 39 39
                            <br />
                            E-posta:{" "}
                            <a className="underline" href="mailto:bilgi@keypadsistem.com">
                                bilgi@keypadsistem.com
                            </a>
                        </div>
                    </div>

                    <p className="mt-6 text-sm text-gray-500 leading-relaxed">
                        Başvurularınız, KVKK ve ilgili mevzuat çerçevesinde değerlendirilerek en geç 30 gün içinde cevaplanır.
                    </p>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        <em>Bu metin, Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti. tarafından hazırlanmıştır.</em>
                    </p>
                </div>
            </div>
        </div>
    );
}