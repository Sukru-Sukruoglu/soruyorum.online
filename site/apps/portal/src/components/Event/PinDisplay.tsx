import React, { useState } from 'react';
import { regeneratePin } from '@/services/api';
import { RefreshCw, Copy, Check } from 'lucide-react';

interface PinDisplayProps {
    eventId: string;
    initialPin: string;
    initialJoinUrl: string;
    initialQrCodeUrl: string;
}

export default function PinDisplay({
    eventId,
    initialPin,
    initialJoinUrl,
    initialQrCodeUrl
}: PinDisplayProps) {
    const [pin, setPin] = useState(initialPin);
    const [loading, setLoading] = useState(false);
    const [inputPin, setInputPin] = useState('');

    const handleRegeneratePin = async () => {
        if (!confirm('Yeni PIN oluşturulacak. Eski PIN geçersiz olacak. Emin misiniz?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await regeneratePin(eventId);
            setPin(result.pin);
            // update other states if needed, though they are usually derived or static for this scope
            alert('Yeni PIN oluşturuldu! 🎉');
        } catch (error: any) {
            alert(error.response?.data?.error || 'PIN oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center mb-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 opacity-90">Etkinlik PIN'i 🔐</h3>

            <div className="flex justify-center gap-2 mb-4">
                {(pin || '------').split('').map((digit, index) => (
                    <span key={index} className="w-12 h-16 bg-white text-indigo-600 text-3xl font-bold rounded-lg flex items-center justify-center shadow-md">
                        {digit}
                    </span>
                ))}
            </div>

            <p className="text-sm opacity-80 mb-4">
                Katılımcılar bu PIN'i girerek etkinliğe katılabilir
            </p>

            <button
                onClick={handleRegeneratePin}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
            >
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {loading ? 'Oluşturuluyor...' : 'Yeni PIN Oluştur'}
            </button>
        </div>
    );
}
