export default function KvkkPage() {
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
                        Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni
                    </h1>

                    <div className="mt-4 flex items-center justify-center">
                        <a
                            className="text-red-600 font-semibold hover:text-red-700 underline underline-offset-2"
                            href="/acik-riza"
                        >
                            Açık Rıza Metni'ni görüntüle
                        </a>
                    </div>

                    <p className="mt-6 text-gray-700 leading-relaxed">
                        <strong>Keypad Sistem İletişim Bilişim Turizm Organizasyon Ticaret Limited Şirketi</strong> olarak, 6698 sayılı
                        Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizi aşağıda açıklanan
                        çerçevede işlemekteyiz.
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

                    <h2 className="mt-10 text-xl font-bold text-gray-900">2. İşlenen Kişisel Verileriniz ve Toplama Yöntemleri</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">Şirketimiz tarafından işlenen kişisel verileriniz şunlardır:</p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>
                            <strong>Kimlik Bilgileri:</strong> Ad, soyad
                        </li>
                        <li>
                            <strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası
                        </li>
                        <li>
                            <strong>İş Bilgileri:</strong> Firma adı, unvan (teklif talepleri için)
                        </li>
                        <li>
                            <strong>Dijital Veriler:</strong> IP adresi, çerezler, oturum bilgileri, cihaz parmak izi (fingerprint)
                        </li>
                    </ul>

                    <p className="mt-6 text-gray-700 leading-relaxed">
                        <strong>Kişisel Verilerinizin Toplanma Yöntemleri:</strong>
                    </p>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Mobil ve masaüstü web formları (mobil.soruyorum.online, sorucevap.online, cevap.live vb.)</li>
                        <li>PIN kodu ile giriş sistemi</li>
                        <li>QR kod tarama</li>
                        <li>E-posta (web sitelerimiz üzerinden gönderilen teklif ve iletişim formları)</li>
                        <li>KVKK onayı: Tüm kayıt işlemlerinde açık rıza onayınız tarih ve saat bilgisi ile birlikte kaydedilir</li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">2.1. Kişisel Verilerin İşlenme Hukuki Dayanağı</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerine uygun olarak aşağıdaki hukuki dayanaklara göre işlenmektedir:
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                            <strong>Açık Rıza:</strong> Etkinlik kayıt formunda "KVKK Aydınlatma ve Açık Rıza Metni"ni onaylayarak 
                            kişisel verilerinizin işlenmesine ve etkinlik organizatörü ile paylaşılmasına açık rıza vermiş olursunuz. 
                            Bu onayınız tarih ve saat bilgisi ile birlikte kaydedilir.
                        </li>
                        <li>
                            <strong>Sözleşmenin İfası:</strong> Müşteri firmalarımızla yapılan hizmet sözleşmelerinin yerine getirilmesi 
                            amacıyla verileriniz işlenir.
                        </li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">3. Kişisel Verilerinizin İşlenme Amaçları</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerine uygun olarak şu amaçlarla işlenmektedir:
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Müşteri kayıt süreçlerinin yürütülmesi</li>
                        <li>Müşteri bilgilendirme hizmetlerinin sunulması</li>
                        <li>Teklif taleplerinin alınması, değerlendirilmesi ve müşterilere sunulması</li>
                        <li>E-posta doğrulama ve onay süreçlerinin yürütülmesi</li>
                        <li>Etkinlik ve oylama sistemlerinin işletilmesi</li>
                        <li>Firmalara özel yazılım projelerinde kimlik doğrulama ve güvenlik önlemleri alınması</li>
                        <li>Raporlama ve istatistiksel analizlerin gerçekleştirilmesi</li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">4. Kişisel Verilerin Kimlerle ve Hangi Amaçla Paylaşılabileceği</h2>
                    
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        <strong>Müşteri Firmalarla Paylaşım:</strong>
                    </p>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        Şirketimizin sunduğu interaktif oylama, soru-cevap ve etkinlik yönetim sistemlerini kullanan kurumsal müşteriler, 
                        kendi etkinliklerinde toplanan verilere erişim sağlar. Bir etkinliğe katıldığınızda girdiğiniz kişisel bilgiler 
                        (ad, soyad, e-posta, telefon) ve etkinlik sırasındaki aktiviteleriniz (sorular, oylar, cevaplar) etkinliği 
                        düzenleyen müşteri firma ile paylaşılır.
                    </p>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        Etkinlik sonrası tüm katılımcı verileri raporlanarak müşteriye teslim edilir ve <strong>en geç 1 hafta içerisinde 
                        sistemlerimizden tamamen silinir.</strong>
                    </p>

                    <p className="mt-4 text-gray-700 leading-relaxed">
                        <strong>Yasal Yükümlülükler:</strong>
                    </p>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        Kişisel verileriniz, yasal zorunluluk halinde yetkili adli ve idari makamlara aktarılabilir.
                    </p>

                    <p className="mt-4 text-gray-700 leading-relaxed">
                        <strong>Veri Güvenliği:</strong>
                    </p>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        Tüm veriler kendi sunucularımızda güvenli şekilde saklanır ve işlenir. Belirtilen durumlar dışında hiçbir 
                        üçüncü taraf ile paylaşım yapılmaz.
                    </p>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">5. Kişisel Verilerin Saklanma Süresi</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        Kişisel verileriniz, toplama amacına uygun olarak aşağıdaki süreler boyunca saklanmaktadır:
                    </p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                            <strong>Etkinlik katılımcı verileri:</strong> Etkinlik sonrası raporlama tamamlandıktan sonra 
                            en geç 1 hafta içinde silinir.
                        </li>
                        <li>
                            <strong>Teklif talep verileri:</strong> Ticari kayıt ve müşteri ilişkileri yönetimi amacıyla, 
                            Türk Ticaret Kanunu ve Vergi Usul Kanunu'nun gerektirdiği süreler boyunca (en fazla 10 yıl) saklanır.
                        </li>
                        <li>
                            <strong>Müşteri sözleşme verileri:</strong> Sözleşme süresi boyunca ve sözleşme sonrası yasal 
                            zamanaşımı süreleri (en fazla 10 yıl) kadar saklanır.
                        </li>
                        <li>
                            <strong>KVKK onay kayıtları:</strong> İspat yükümlülüğü nedeniyle yasal zamanaşımı süreleri 
                            boyunca saklanır.
                        </li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">6. KVKK Kapsamındaki Haklarınız</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">KVKK'nın 11. maddesi uyarınca, aşağıdaki haklara sahipsiniz:</p>
                    <ul className="mt-3 list-disc pl-6 text-gray-700 space-y-1">
                        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                        <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                        <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                        <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                        <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde verilerin silinmesini veya yok edilmesini talep etme</li>
                        <li>Düzeltme, silme ve yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                        <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                        <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                    </ul>

                    <h2 className="mt-10 text-xl font-bold text-gray-900">7. KVKK ile İlgili Başvurular</h2>
                    <p className="mt-3 text-gray-700 leading-relaxed">
                        KVKK ile ilgili taleplerinizi <strong>bilgi@keypadsistem.com</strong> adresine e-posta göndererek ya da aşağıdaki adrese yazılı olarak iletebilirsiniz.
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-900 text-white p-5">
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
                        Başvurularınız, KVKK ve ilgili mevzuat çerçevesinde değerlendirilerek mümkün olan en kısa sürede ve 
                        en geç 30 (otuz) gün içinde sonuçlandırılır.
                    </p>

                    <p className="mt-8 text-sm text-gray-500">
                        <em>Bu metin, Keypad Sistem İletişim Bilişim Turizm Org. Tic. Ltd. Şti. tarafından hazırlanmıştır.</em>
                    </p>
                </div>
            </div>
        </div>
    );
}