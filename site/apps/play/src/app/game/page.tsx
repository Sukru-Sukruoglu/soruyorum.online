"use client";

import { Button } from "@ks-interaktif/ui";
import { useState } from "react";

export default function GamePage() {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Mock Data
    const question = {
        id: 1,
        text: "Hangi gezegen Güneş Sistemindeki en büyük gezegendir?",
        options: [
            { id: 0, text: "Mars", color: "bg-red-500" },
            { id: 1, text: "Jüpiter", color: "bg-indigo-600" },
            { id: 2, text: "Satürn", color: "bg-yellow-500" },
            { id: 3, text: "Venüs", color: "bg-green-500" },
        ]
    };

    const handleAnswer = (index: number) => {
        if (submitted) return;
        setSelectedAnswer(index);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
                    ⏳
                </div>
                <h2 className="text-2xl font-bold mb-2">Cevap Gönderildi!</h2>
                <p className="text-gray-400">Diğer katılımcılar bekleniyor...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center">
                <div className="font-bold text-gray-900 border-2 border-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                    1
                </div>
                <div className="text-sm font-medium text-gray-500">SORU 1/10</div>
                <div className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    1200 P
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 bg-white p-6 flex items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {question.text}
                </h2>
            </div>

            {/* Options */}
            <div className="p-4 grid grid-cols-1 gap-3 pb-8 bg-gray-50">
                {question.options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleAnswer(option.id)}
                        className={`h-20 w-full rounded-xl shadow-sm text-white font-bold text-lg transition-transform active:scale-95 flex items-center px-6 ${option.color}`}
                    >
                        {/* Shape Icon could go here */}
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
