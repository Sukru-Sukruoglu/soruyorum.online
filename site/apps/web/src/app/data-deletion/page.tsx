export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Veri Silme Talebi</h1>
                    <p className="text-gray-400 mb-8">Instagram verilerinizin silinmesini talep edebilirsiniz.</p>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                        <p className="text-yellow-300 text-sm">
                            <strong>Not:</strong> Veri silme işlemi geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                        </p>
                    </div>

                    <div className="space-y-6 text-gray-300">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">Nasıl Talepte Bulunurum?</h2>
                            <p>Veri silme talebinizi email ile gönderin:</p>

                            <div className="bg-white/5 rounded-xl p-4 mt-4">
                                <p className="font-semibold text-white">Email: sukru@keypadsistem.com</p>
                                <p className="text-gray-400 mt-2">Konu: Instagram Veri Silme Talebi</p>
                                <p className="text-gray-400 mt-2">İçerik:</p>
                                <ul className="list-disc list-inside text-gray-400 ml-4">
                                    <li>Instagram kullanıcı adınız</li>
                                    <li>Kayıtlı email adresiniz</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">Süreç</h2>
                            <p>Talebiniz 24-48 saat içinde işleme alınacak.</p>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
                        <a href="/privacy" className="text-gray-400 hover:text-white text-sm">Gizlilik Politikası</a>
                        <a href="/terms" className="text-gray-400 hover:text-white text-sm">Kullanım Koşulları</a>
                        <a href="/" className="text-blue-400 hover:underline text-sm ml-auto">← Ana Sayfa</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
