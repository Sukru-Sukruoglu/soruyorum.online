"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@ks-interaktif/ui";
import { MessageSquare } from "lucide-react";
import { getSocket } from "../../lib/socket";

function LobbyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const name = searchParams.get("name");
    const avatarSeed = searchParams.get("avatar");

    // Simulate waiting for game start
    const [status, setStatus] = useState("LOBBY");
    const [participantsCount, setParticipantsCount] = useState(0);

    useEffect(() => {
        const socket = getSocket();
        socket.connect();

        socket.emit("join_room", { pin: "1234", name, avatar: avatarSeed }); // Using demo PIN for now. Real PIN would come from URL if needed.

        socket.on("game_state", (data: any) => {
            setStatus(data.status);
            setParticipantsCount(data.participantsCount);
        });

        socket.on("participant_joined", (data: any) => {
            // Toast or notification
            console.log("New user:", data);
            setParticipantsCount((prev) => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, [name, avatarSeed]);

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
                    onClick={() => router.push(`/qanda?name=${name}&avatar=${avatarSeed}`)}
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
