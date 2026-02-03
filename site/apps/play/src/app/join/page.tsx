"use client";

import { Button } from "@ks-interaktif/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function JoinForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pin = searchParams.get("pin");

    const [name, setName] = useState("");
    const [avatarSeed, setAvatarSeed] = useState(Math.floor(Math.random() * 1000));

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.length > 0) {
            router.push(`/lobby?pin=${pin}&name=${name}&avatar=${avatarSeed}`);
        }
    };

    const cycleAvatar = () => {
        setAvatarSeed(Math.floor(Math.random() * 1000));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-gray-900">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Profilini Oluştur</h1>
                    <p className="text-gray-500">PIN: <span className="font-mono font-bold text-gray-900">{pin}</span></p>
                </div>

                {/* Avatar Selector */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 cursor-pointer hover:scale-105 transition-transform" onClick={cycleAvatar}>
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button type="button" onClick={cycleAvatar} className="text-indigo-600 text-sm font-medium hover:underline">
                        Karakteri Değiştir 🎲
                    </button>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">Adın nedir?</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Takma Adın"
                            className="w-full h-14 px-4 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg"
                            autoFocus
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                        Oyuna Katıl
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
            <JoinForm />
        </Suspense>
    );
}
