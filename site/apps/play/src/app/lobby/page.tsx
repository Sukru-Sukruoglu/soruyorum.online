"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@ks-interaktif/ui";
import { MessageSquare, AlertCircle, XCircle } from "lucide-react";
import { getFreshSocket } from "../../lib/socket";

function LobbyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const name = searchParams.get("name");
    const avatarSeed = searchParams.get("avatar");
    const pin = searchParams.get("pin");

    // Simulate waiting for game start
    const [status, setStatus] = useState("LOBBY");
    const [participantsCount, setParticipantsCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [eventEnded, setEventEnded] = useState(false);
    const [endMessage, setEndMessage] = useState("");
    const [waitingInfo, setWaitingInfo] = useState<{ position: number; limit: number; eventName: string } | null>(null);

    useEffect(() => {
        if (!pin) {
            setError("PIN kodu bulunamadı. Lütfen tekrar katılın.");
            return;
        }

        // Always get a fresh socket to ensure we're not connected to old events
        const socket = getFreshSocket();
        socket.connect();

        socket.emit("join_room", { pin, name, avatar: avatarSeed });

        // Success handler
        socket.on("join_success", (data: any) => {
            console.log("Joined event:", data.eventName);
            setWaitingInfo(null);
        });

        socket.on("waiting_room", (data: any) => {
            setWaitingInfo({
                position: Number(data.position || 1),
                limit: Number(data.limit || 0),
                eventName: String(data.eventName || "Etkinlik"),
            });
        });

        socket.on("waiting_room_update", (data: any) => {
            setWaitingInfo((prev) => ({
                position: Number(data.position || prev?.position || 1),
                limit: Number(data.limit || prev?.limit || 0),
                eventName: String(data.eventName || prev?.eventName || "Etkinlik"),
            }));
        });

        // Error handler - invalid PIN or event not active
        socket.on("join_error", (data: any) => {
            console.error("Join error:", data);
            setError(data.message || "Etkinliğe katılırken bir hata oluştu.");
        });

        // Kicked handler - PIN changed
        socket.on("kicked", (data: any) => {
            console.warn("Kicked from event:", data);
            setError(data.reason || "Etkinlikten çıkarıldınız.");
        });

        // Event ended handler
        socket.on("event_ended", (data: any) => {
            console.log("Event ended:", data);
            setEventEnded(true);
            setEndMessage(data.message || "Etkinlik sona erdi.");
        });

        socket.on("game_state", (data: any) => {
            setStatus(data.status);
            setParticipantsCount(data.participantsCount);
        });

        socket.on("participant_joined", (data: any) => {
            // Toast or notification
            console.log("New user:", data);
            setParticipantsCount((prev) => prev + 1);
        });

        socket.on("participant_left", (data: any) => {
            console.log("User left:", data);
            setParticipantsCount((prev) => Math.max(0, prev - 1));
        });

        return () => {
            socket.disconnect();
        };
    }, [pin, name, avatarSeed]);

    // Error state - show error message with retry button
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-600 text-white">
                <XCircle size={64} className="mb-4" />
                <h1 className="text-2xl font-bold mb-4 text-center">Bağlantı Hatası</h1>
                <p className="text-center mb-8 max-w-sm">{error}</p>
                <Button
                    onClick={() => router.push("/")}
                    className="bg-white text-red-600 hover:bg-white/90 h-14 px-8 rounded-2xl font-bold text-lg"
                >
                    Yeni PIN ile Katıl
                </Button>
            </div>
        );
    }

    // Event ended state
    if (eventEnded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-indigo-900 text-white">
                <AlertCircle size={64} className="mb-4 text-yellow-400" />
                <h1 className="text-2xl font-bold mb-4 text-center">Etkinlik Sona Erdi</h1>
                <p className="text-center mb-8 max-w-sm">{endMessage}</p>
                <Button
                    onClick={() => router.push("/")}
                    className="bg-white text-indigo-900 hover:bg-white/90 h-14 px-8 rounded-2xl font-bold text-lg"
                >
                    Ana Sayfa
                </Button>
            </div>
        );
    }

    if (waitingInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-indigo-700 text-white">
                <div className="max-w-md text-center space-y-5">
                    <MessageSquare size={64} className="mx-auto" />
                    <h1 className="text-3xl font-bold">Oturum Dolu</h1>
                    <p className="text-indigo-100">
                        {waitingInfo.eventName} oturumunda su anda {waitingInfo.limit} canli katilimci var.
                    </p>
                    <div className="rounded-2xl bg-white/10 px-6 py-5 backdrop-blur-md">
                        <div className="text-sm uppercase tracking-[0.24em] text-indigo-100">Bekleme Sirasi</div>
                        <div className="mt-2 text-5xl font-black">#{waitingInfo.position}</div>
                        <p className="mt-3 text-sm text-indigo-100">
                            Yer acildiginda otomatik olarak oturuma alinacaksiniz.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/")}
                        className="bg-white text-indigo-700 hover:bg-white/90 h-14 px-8 rounded-2xl font-bold text-lg"
                    >
                        Yeni PIN ile Katil
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-between min-h-screen p-8 bg-indigo-600 text-white relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center flex-1 justify-center space-y-8">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Hazır mısın, {name}?</h1>
                    <p className="text-indigo-100 text-lg animate-pulse">Oyunun başlaması bekleniyor...</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 text-center max-w-xs w-full">
                    <p className="text-sm font-medium opacity-80 mb-1">ŞU ANKİ DURUM</p>
                    <p className="text-xl font-bold">{participantsCount} Katılımcı Bekliyor</p>
                    <p className="text-xs mt-2 opacity-70">Durum: {status}</p>
                </div>

                <Button
                    onClick={() => router.push(`/qanda?pin=${pin}&name=${name}&avatar=${avatarSeed}`)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 h-14 px-8 rounded-2xl gap-3 font-bold text-lg backdrop-blur-sm transition-all active:scale-95"
                >
                    <MessageSquare size={22} /> Soru Sor
                </Button>
            </div>

            <div className="relative z-10 text-sm opacity-60 pb-4">
                Ekranını açık tut
            </div>
        </div>
    );
}

export default function LobbyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-indigo-600 text-white">Bağlanılıyor...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
