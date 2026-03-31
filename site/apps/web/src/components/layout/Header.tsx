"use client";

import Link from "next/link";
import { Button, Logo } from "@ks-interaktif/ui";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container mx-auto px-4 h-28 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Logo variant="light" size="sm" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="#features" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Özellikler
                    </Link>
                    <Link href="#about" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Hakkımızda
                    </Link>
                    <Link href="#hardware" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Donanımlarımız
                    </Link>
                    <Link href="#software" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Yazılımlarımız
                    </Link>
                    <Link href="#testimonials" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Referanslarımız
                    </Link>
                    <Link href="#pricing" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        Fiyatlandırma
                    </Link>
                    <Link href="#contact" className="text-gray-600 hover:text-red-600 font-medium transition-colors text-sm">
                        İletişim
                    </Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="https://soruyorum.online/login" className="text-gray-700 font-medium hover:text-red-600">
                        Giriş Yap
                    </Link>
                    <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 shadow-lg shadow-red-600/20 border-0">
                        Ücretsiz Başla
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-gray-600"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 p-4 absolute w-full shadow-lg">
                    <div className="flex flex-col gap-2">
                        <Link
                            href="#features"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Özellikler
                        </Link>
                        <Link
                            href="#about"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Hakkımızda
                        </Link>
                        <Link
                            href="#hardware"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Donanımlarımız
                        </Link>
                        <Link
                            href="#software"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Yazılımlarımız
                        </Link>
                        <Link
                            href="#testimonials"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Referanslarımız
                        </Link>
                        <Link
                            href="#pricing"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Fiyatlandırma
                        </Link>
                        <Link
                            href="#contact"
                            className="px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            İletişim
                        </Link>
                        <div className="border-t border-gray-100 my-2 pt-4 flex flex-col gap-3">
                            <Link
                                href="https://soruyorum.online/login"
                                className="text-center py-2 text-gray-700 font-medium"
                            >
                                Giriş Yap
                            </Link>
                            <Button className="w-full bg-indigo-600 text-white rounded-lg py-3">
                                Ücretsiz Başla
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
