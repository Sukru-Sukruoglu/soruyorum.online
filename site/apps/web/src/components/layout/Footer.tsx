import Link from "next/link";
import { Twitter, Linkedin, Youtube, Instagram } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-black text-gray-300 py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-28 h-28 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/kslogohome.png" alt="KS İnteraktif Logo" className="w-full h-full object-contain" />
                            </div>
                        </Link>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Toplantı ve etkinliklerinizi interaktif hale getirin.
                            Canlı oylamalar, oyunlar ve yarışmalar düzenleyin.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-red-500 transition-colors"><Twitter size={20} /></Link>
                            <Link href="#" className="hover:text-red-500 transition-colors"><Linkedin size={20} /></Link>
                            <Link href="#" className="hover:text-red-500 transition-colors"><Youtube size={20} /></Link>
                            <Link href="#" className="hover:text-red-500 transition-colors"><Instagram size={20} /></Link>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Ürün</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Özellikler</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Fiyatlandırma</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Oyunlar</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Entegrasyonlar</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">API</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Kaynaklar</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Eğitimler</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Yardım Merkezi</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Topluluk</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">İletişim</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-6">Şirket</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Hakkımızda</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Kariyer</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Basın</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Gizlilik</Link></li>
                            <li><Link href="#" className="hover:text-red-500 transition-colors">Kullanım Şartları</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © 2026 KS İnteraktif. Tüm hakları saklıdır.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">🇹🇷 Türkçe</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
