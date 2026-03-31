"use client";

import { Button } from "@ks-interaktif/ui";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { resetSocket } from "../lib/socket";

export default function PinEntryPage() {
    const [pin, setPin] = useState("");
    const router = useRouter();

    // Reset any existing socket connection when returning to PIN entry
    useEffect(() => {
        resetSocket();
        
        // Clear old session data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('currentPin');
            localStorage.removeItem('participantName');
            localStorage.removeItem('eventId');
            localStorage.removeItem('participantId');
            localStorage.removeItem('sessionId');
        }
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length > 0) {
            router.push(`/join?pin=${pin}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold mb-8 shadow-xl">
                SY
            </div>

            <h1 className="text-4xl font-bold mb-2">Hoş Geldiniz!</h1>
            <p className="text-indigo-100 mb-10 text-center">Etkinliğe katılmak için PIN kodunu girin</p>

            <form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
                <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Game PIN"
                    className="w-full h-16 text-center text-3xl font-bold tracking-widest rounded-xl border-none outline-none text-gray-900 placeholder-gray-300 shadow-lg"
                    autoFocus
                />

                <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-gray-900 text-white hover:bg-black transition-transform active:scale-95 shadow-xl"
                >
                    Giriş Yap
                </Button>
            </form>

            <div className="mt-12 text-sm text-white/50">
                soruyorum.online
            </div>
        </div>
    );
}
