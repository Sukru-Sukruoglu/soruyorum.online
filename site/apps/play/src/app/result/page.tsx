"use client";

import { Button } from "@ks-interaktif/ui";
import Link from "next/link";
import { Home } from "lucide-react";

export default function ResultPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-indigo-600 text-white relative overflow-hidden">
            {/* Confetti Effect (CSS only mock) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="absolute bg-white w-2 h-2 rounded-full animate-ping" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: 0.3
                    }}></div>
                ))}
            </div>

            <div className="relative z-10 text-center space-y-8 w-full max-w-sm">
                <div className="inline-block relative">
                    <div className="text-6xl mb-2">🏆</div>
                    <div className="text-sm font-bold bg-white text-indigo-900 px-3 py-1 rounded-full absolute -bottom-2 left-1/2 -translate-x-1/2 shadow-lg whitespace-nowrap">
                        4. Sıradasın
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Tebrikler!</h1>
                    <p className="text-indigo-200">Harika bir iş çıkardın.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                        <div className="text-xs text-indigo-200 mb-1">PUAN</div>
                        <div className="text-2xl font-bold">8,450</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
                        <div className="text-xs text-indigo-200 mb-1">DOĞRU</div>
                        <div className="text-2xl font-bold">9/10</div>
                    </div>
                </div>

                <div className="pt-8">
                    <Link href="/">
                        <Button className="w-full bg-white text-indigo-600 hover:bg-gray-100 gap-2 h-14 text-lg">
                            <Home size={20} /> Ana Sayfaya Dön
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
