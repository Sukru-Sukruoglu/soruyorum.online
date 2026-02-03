export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Gizlilik Politikası</h1>
                    <p className="text-gray-400 mb-8">Son güncelleme: 24 Ocak 2025</p>

                    <div className="space-y-6 text-gray-300">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Veri Toplama</h2>
                            <p>KS Interaktif uygulamaları, Instagram üzerinden herkese açık olarak paylaştığınız içerikleri toplar:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li>Instagram kullanıcı adınız</li>
                                <li>Paylaştığınız fotoğraf/video</li>
                                <li>Paylaşım açıklaması</li>
                                <li>Paylaşım tarihi</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Kullanım Amacı</h2>
                            <p>Toplanan veriler yalnızca etkinlik duvarlarında gösterilmek amacıyla kullanılır.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. Veri Saklama</h2>
                            <p>Verileriniz etkinlik süresince saklanır. Etkinlik sonunda silinebilir.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Veri Silme</h2>
                            <p>
                                Verilerinizin silinmesini talep etmek için{' '}
                                <a href="/data-deletion" className="text-blue-400 hover:underline">veri silme sayfamızı</a> ziyaret edin.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. İletişim</h2>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="font-semibold text-white">KS Interaktif</p>
                                <p>Email: sukru@keypadsistem.com</p>
                                <p>Web: www.ksinteraktif.com</p>
                            </div>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <a href="/" className="text-blue-400 hover:underline">← Ana Sayfaya Dön</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
