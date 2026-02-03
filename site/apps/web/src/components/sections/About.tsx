"use client";

import { Sparkles, Target, History, Rocket } from "lucide-react";

export function About() {
    return (
        <section id="about" className="py-32 bg-white relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-red-50 rounded-full blur-[100px] -translate-x-1/2 -z-10"></div>

            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    {/* Image / Visual Side */}
                    <div className="lg:w-1/2 relative">
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-red-500/10 border-8 border-gray-50">
                            <div className="aspect-[4/5] bg-gradient-to-br from-black to-red-950 p-12 flex flex-col justify-center">
                                <div className="space-y-8">
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-xs">
                                        <History size={16} /> Birlikte Başlayan Macera
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                        Teknolojiyi <br />
                                        <span className="text-red-500">İnsan Odağına</span> <br />
                                        Taşıyoruz.
                                    </h3>
                                    <p className="text-gray-400 text-lg font-medium leading-relaxed">
                                        Keypad Sistem olarak, toplantılarınızda katılımcılara bilgilerin iletilmesinde, analiz edilmesinde ve raporlanmasında Türkiye'nin öncü çözümlerini sunuyoruz.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 hidden md:block animate-float z-20">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                    <Rocket size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">2006'dan Beri</p>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kesintisiz İnovasyon</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="lg:w-1/2 space-y-12">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 tracking-tighter">
                                Etkileşimin <br />
                                <span className="text-red-600">Dijital Mimarı</span>
                            </h2>
                            <p className="text-xl text-gray-500 leading-relaxed font-medium">
                                Dijital ürünlerin hayatımızı dönüştürdüğü bu çağda, biz de toplantı ve etkinliklerinizi "sadece izlenen" değil, "yaşanan" deneyimlere dönüştürüyoruz.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Yenilikçi Vizyon</h4>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">
                                    Sadece bugünün değil, geleceğin etkileşim teknolojilerini bugünden toplantı odalarınıza getiriyoruz.
                                </p>
                            </div>
                            <div className="space-y-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                    <Target size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Sonuç Odaklılık</h4>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">
                                    Topladığımız her geri bildirim, raporladığımız her veri sizin için birer değer önerisine dönüşür.
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-12">
                                <div>
                                    <p className="text-4xl font-black text-red-600">1000+</p>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Etkinlik</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-red-600">500k+</p>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Katılımcı</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
