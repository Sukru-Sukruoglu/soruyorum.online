"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare, User, Hash, PowerOff, Mail, Phone, CreditCard, FileCheck } from 'lucide-react';

interface RegistrationSettings {
    requirePin: boolean;
    requireName: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    requireAvatar: boolean;
    requireId: boolean;
    allowAnonymous: boolean;
    requireKvkkConsent: boolean;
}

function JoinPageContent() {
    const searchParams = useSearchParams();
    const isMobile = /mobile/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [participantIdField, setParticipantIdField] = useState('');
    const [avatar, setAvatar] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [kvkkConsent, setKvkkConsent] = useState(true);

    // Avatar image options
    const avatarImages = [
        'Man-Avatar-01.png', 'Man-Avatar-03.png', 'Man-Avatar-05.png', 'Man-Avatar-10.png',
        'Man-Avatar-11.png', 'Man-Avatar-12.png', 'Man-Avatar-14.png', 'Man-Avatar-16.png',
        'Woman-Avatar-02.png', 'Woman-Avatar-04.png', 'Woman-Avatar-06.png', 'Woman-Avatar-07.png',
        'Woman-Avatar-08.png', 'Woman-Avatar-09.png', 'Woman-Avatar-13.png', 'Woman-Avatar-15.png',
        'Woman-Avatar-17.png'
    ];
    const defaultAvatar = 'Man-Avatar-01.png';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [joined, setJoined] = useState(false);
    const [eventInfo, setEventInfo] = useState<any>(null);
    const [participantId, setParticipantId] = useState('');
    const [question, setQuestion] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(false);

    const isQandaStoppedMessage = infoMessage
        ? infoMessage.toLocaleLowerCase('tr-TR').includes('soru gönderimi bitmiştir')
        : false;

    // Restore session on refresh (especially important on mobile browsers)
    useEffect(() => {
        try {
            const storedParticipantId = localStorage.getItem('participantId') || '';
            const storedEventId = localStorage.getItem('eventId') || '';
            const storedEventInfoRaw = localStorage.getItem('eventInfo');
            const storedName = localStorage.getItem('participantName') || '';
            const storedAvatar = localStorage.getItem('participantAvatar') || '';

            if (!storedParticipantId || !storedEventId || !storedEventInfoRaw) return;

            const parsedEventInfo = JSON.parse(storedEventInfoRaw);
            if (!parsedEventInfo?.id || parsedEventInfo.id !== storedEventId) return;

            setParticipantId(storedParticipantId);
            setEventInfo(parsedEventInfo);
            if (storedName) setName(storedName);
            if (storedAvatar) setAvatar(storedAvatar);
            setJoined(true);
        } catch {
            // ignore
        }
    }, []);

    const handleLogout = async (options?: { keepInfoMessage?: boolean }) => {
        const currentParticipantId = participantId;
        const currentEventId = eventInfo?.id;

        // Stop UI + heartbeat ASAP
        setJoined(false);
        setEventInfo(null);
        setParticipantId('');
        setQuestion('');
        setSent(false);
        setError('');
        if (!options?.keepInfoMessage) setInfoMessage('');

        // Mark as left on server so moderator list removes them
        try {
            if (currentParticipantId && currentEventId) {
                await fetch('/api/public/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId: currentParticipantId, eventId: currentEventId }),
                });
            }
        } catch {
            // ignore
        }

        try {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('participantId');
            localStorage.removeItem('eventId');
            localStorage.removeItem('eventInfo');
            localStorage.removeItem('participantName');
            localStorage.removeItem('participantAvatar');
        } catch {
            // ignore
        }
    };

    // Keep participant presence fresh (for online/offline indicator in admin)
    useEffect(() => {
        if (!joined || !eventInfo?.id || !participantId) return;

        let cancelled = false;

        const sendHeartbeat = async () => {
            try {
                const response = await fetch('/api/public/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId, eventId: eventInfo.id }),
                });

                const data = await response.json().catch(() => null);
                if (data?.qandaStopped || data?.status === 'stopped') {
                    setInfoMessage(data?.message || 'Soru gönderimi bitmiştir');
                    await handleLogout({ keepInfoMessage: true });
                }

                if (data?.kicked || data?.status === 'kicked' || data?.code === 'KICKED') {
                    setInfoMessage(data?.message || 'Oturumunuz sonlandırıldı');
                    await handleLogout({ keepInfoMessage: true });
                }
            } catch (e) {
                // Ignore; admin will show offline if heartbeats fail
                if (!cancelled) console.warn('Heartbeat failed');
            }
        };

        sendHeartbeat();
        // Keep this fairly frequent so "Sunumu Durdur" reflects quickly on participant devices.
        const interval = setInterval(sendHeartbeat, 8000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [joined, eventInfo?.id, participantId]);

    // Auto-fill PIN from URL
    useEffect(() => {
        const urlPin = searchParams.get('pin');
        if (urlPin) {
            setPin(urlPin);
        }
    }, [searchParams]);

    // Fetch registration settings when PIN is complete
    useEffect(() => {
        if (pin.length !== 6) {
            setRegistrationSettings(null);
            return;
        }

        const fetchSettings = async () => {
            setLoadingSettings(true);
            setError('');
            try {
                const response = await fetch(`/api/public/join-info?pin=${pin}`);
                const data = await response.json();
                
                if (!response.ok) {
                    if (response.status === 403 && data?.code === 'QANDA_STOPPED') {
                        setInfoMessage(data?.error || 'Soru gönderimi bitmiştir');
                    } else {
                        setError(data?.error || 'Etkinlik bilgisi alınamadı');
                    }
                    setRegistrationSettings(null);
                    return;
                }
                
                setRegistrationSettings(data.registration);
            } catch (err) {
                console.error('Failed to fetch event settings:', err);
                // Don't block join - use default settings if fetch fails
                setRegistrationSettings({
                    requirePin: true,
                    requireName: true,
                    requireEmail: false,
                    requirePhone: false,
                    requireAvatar: false,
                    requireId: false,
                    allowAnonymous: false,
                    requireKvkkConsent: false,
                });
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchSettings();
    }, [pin]);

    // If KVKK consent is required for this event, keep it always checked.
    useEffect(() => {
        if (registrationSettings?.requireKvkkConsent) {
            setKvkkConsent(true);
        }
    }, [registrationSettings?.requireKvkkConsent]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');
        setLoading(true);

        try {
            const resolvedAvatar = avatar || (isMobile ? defaultAvatar : '');

            // Initialize FingerprintJS
            const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
            const fp = await FingerprintJS.load();
            const result = await fp.get();

            const visitorId = result.visitorId;

            // Use relative URL for same-origin API route
            const response = await fetch('/api/public/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    name: name || undefined,
                    email: email || undefined,
                    phone: phone || undefined,
                    avatar: resolvedAvatar || undefined,
                    participantIdField: participantIdField || undefined,
                    kvkkConsent: kvkkConsent || undefined,
                    fingerprint: visitorId,
                    deviceType: isMobile ? 'mobile' : 'desktop',
                    browser: navigator.userAgent,
                    os: navigator.platform
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 403 && data?.code === 'QANDA_STOPPED') {
                    setInfoMessage(data?.error || 'Soru gönderimi bitmiştir');
                    return;
                }
                if (response.status === 403 && data?.code === 'KICKED') {
                    // Force-clear any stale restored session and show message.
                    try {
                        localStorage.removeItem('sessionId');
                        localStorage.removeItem('participantId');
                        localStorage.removeItem('eventId');
                        localStorage.removeItem('eventInfo');
                        localStorage.removeItem('participantName');
                        localStorage.removeItem('participantAvatar');
                    } catch {
                        // ignore
                    }
                    setInfoMessage(data?.error || 'Oturumunuz sonlandırıldı');
                    return;
                }
                if (response.status === 403 && data?.code === 'TRIAL_EXPIRED') {
                    setInfoMessage(data?.error || 'Deneme süresi doldu. Devam etmek için lütfen paket satın alın.');
                    return;
                }
                if (response.status === 403 && data?.code === 'MOBILE_DEVICE_LIMIT') {
                    setInfoMessage(data?.error || 'Mobil cihaz bağlantı limiti doldu');
                    return;
                }
                throw new Error(data.error || 'Katılım başarısız');
            }

            const { participant, event } = data;

            // Session'a kaydet
            localStorage.setItem('sessionId', participant.sessionId);
            localStorage.setItem('participantId', participant.id);
            localStorage.setItem('eventId', event.id);
            localStorage.setItem('eventInfo', JSON.stringify(event));
            if (participant?.name) {
                localStorage.setItem('participantName', participant.name);
            }
            if (resolvedAvatar) {
                localStorage.setItem('participantAvatar', resolvedAvatar);
            }

            // Server is the source of truth (especially when a session is restored by fingerprint).
            if (participant?.name) {
                setName(participant.name);
            }
            
            setParticipantId(participant.id);
            setEventInfo(event);
            setJoined(true);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Katılım başarısız. PIN kodunu kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
        
        setSending(true);
        setError('');

        try {
            const response = await fetch('/api/public/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: eventInfo.id,
                    participantId,
                    questionText: question,
                    participantName: name
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 403 && data?.code === 'QANDA_STOPPED') {
                    setInfoMessage(data?.error || 'Soru gönderimi bitmiştir');
                    await handleLogout({ keepInfoMessage: true });
                    return;
                }
                throw new Error(data.error || 'Soru gönderilemedi');
            }

            setSent(true);
            setQuestion('');
            
            // Reset sent state after 3 seconds
            setTimeout(() => setSent(false), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Soru gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    // Question sending screen (after joining)
    if (joined && eventInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col">
                {/* Header */}
                <div className="bg-black/30 backdrop-blur-md p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                                {avatar ? (
                                    <img 
                                        src={`/avatars/${avatar}`} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div>
                                <p className="font-bold">{name}</p>
                                <p className="text-xs text-white/60">{eventInfo.title || 'Etkinlik'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                Bağlı
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30 transition-colors"
                            >
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-md space-y-6">
                        
                        {/* Success Message */}
                        {sent && (
                            <div className="bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 rounded-2xl p-4 text-center animate-in fade-in zoom-in duration-300">
                                <div className="text-3xl mb-2">✅</div>
                                <p className="font-bold">Sorunuz gönderildi!</p>
                                <p className="text-sm text-green-300/70">Moderatör onayından sonra ekranda görünecek</p>
                            </div>
                        )}

                        {infoMessage && (
                            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 text-yellow-100 rounded-2xl p-4 text-center">
                                {infoMessage}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 rounded-2xl p-4 text-center">
                                {error}
                            </div>
                        )}

                        {/* Question Form */}
                        <form onSubmit={handleSendQuestion} className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-indigo-500/30 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="text-indigo-300" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Soru Sor</h2>
                                        <p className="text-white/50 text-sm">Sorunuz ekranda görüntülenecek</p>
                                    </div>
                                </div>

                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Sorunuzu buraya yazın..."
                                    rows={4}
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 resize-none text-lg"
                                    maxLength={500}
                                />
                                
                                <div className="flex justify-between items-center mt-2 text-white/40 text-xs">
                                    <span>{question.length}/500</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!question.trim() || sending}
                                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Soruyu Gönder
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-black/20 p-4 text-center text-white/40 text-xs">
                    KS İnteraktif &copy; {new Date().getFullYear()}
                </div>
            </div>
        );
    }

    // Join screen (initial)
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {isQandaStoppedMessage && (
                    <div className="bg-black/20 backdrop-blur-md rounded-3xl p-8 border border-white/15 shadow-2xl mb-6">
                        <div className="text-center text-white space-y-4">
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
                                <PowerOff className="text-red-300" size={40} />
                            </div>
                            <h2 className="text-2xl font-black">Soru gönderimi bitmiştir</h2>
                            <p className="text-white/70">Katılımınız için teşekkür ederiz.</p>
                            <button
                                type="button"
                                onClick={() => setInfoMessage('')}
                                className="mt-2 w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl border border-white/15 transition-colors"
                            >
                                Farklı bir etkinliğe katıl
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Logo & Title with Avatar */}
                <div className="text-center mb-8">
                    {/* Avatar Section - shown when avatar is required and PIN is entered */}
                    {registrationSettings?.requireAvatar && pin.length === 6 ? (
                        <>
                            {/* Avatar Display */}
                            <div className="relative inline-block mb-4">
                                <div 
                                    className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg mx-auto overflow-hidden cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                >
                                    {avatar ? (
                                        <img 
                                            src={`/avatars/${avatar}`}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={48} className="text-gray-400" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                    className="mt-2 px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-full shadow-md transition-colors"
                                >
                                    Avatar Seç
                                </button>

                                {isMobile && !avatar && (
                                    <p className="mt-2 text-xs text-white/60">
                                        Mobilde avatar seçmek isteğe bağlıdır.
                                    </p>
                                )}
                            </div>

                            {/* Avatar Picker Modal */}
                            {showAvatarPicker && (
                                <>
                                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAvatarPicker(false)}></div>
                                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 w-[90%] max-w-md shadow-2xl">
                                        <h3 className="text-gray-900 font-bold text-lg mb-4 text-center">Avatar Seçin</h3>
                                        <div className="grid grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                                            {avatarImages.map((img) => (
                                                <button
                                                    key={img}
                                                    type="button"
                                                    onClick={() => {
                                                        setAvatar(img);
                                                        setShowAvatarPicker(false);
                                                    }}
                                                    className={`aspect-square rounded-xl overflow-hidden border-4 transition-all hover:scale-105 ${
                                                        avatar === img 
                                                            ? 'border-teal-500 shadow-lg scale-105' 
                                                            : 'border-gray-200 hover:border-teal-300'
                                                    }`}
                                                >
                                                    <img 
                                                        src={`/avatars/${img}`}
                                                        alt="Avatar option"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAvatarPicker(false)}
                                            className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                        >
                                            Kapat
                                        </button>
                                    </div>
                                </>
                            )}

                            <h1 className="text-2xl font-black text-white mb-1">Hoş Geldiniz</h1>
                            <p className="text-white/60 text-sm">Katılmak için bilgilerinizi girin</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                <MessageSquare className="text-white" size={40} />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2">Etkinliğe Katıl</h1>
                            <p className="text-white/60">PIN kodunu gir ve sorularını gönder!</p>
                        </>
                    )}
                </div>

                {/* Form Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <form onSubmit={handleJoin} className="space-y-6">

                        {infoMessage && (
                            <div className="bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 rounded-xl p-3 text-sm text-center">
                                {infoMessage}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl p-3 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* PIN Input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                                <Hash size={16} />
                                PIN Kodu
                            </label>
                            <input
                                type="text"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                placeholder="123456"
                                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-white/20 text-white"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Loading settings indicator */}
                        {loadingSettings && pin.length === 6 && (
                            <div className="flex items-center justify-center gap-2 text-white/60 text-sm py-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Etkinlik bilgileri yükleniyor...
                            </div>
                        )}

                        {/* Dynamic fields based on registration settings */}
                        {registrationSettings && pin.length === 6 && (
                            <>
                                {/* Name field */}
                                {registrationSettings.requireName && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                                            <User size={16} />
                                            Adınız
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Adınızı girin"
                                            className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder:text-white/20 text-lg"
                                            required={registrationSettings.requireName && !registrationSettings.allowAnonymous}
                                        />
                                    </div>
                                )}

                                {/* Email field */}
                                {registrationSettings.requireEmail && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                                            <Mail size={16} />
                                            E-Posta
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ornek@email.com"
                                            className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder:text-white/20 text-lg"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Phone field */}
                                {registrationSettings.requirePhone && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                                            <Phone size={16} />
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="05XX XXX XX XX"
                                            className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder:text-white/20 text-lg"
                                            required
                                        />
                                    </div>
                                )}

                                {/* ID field */}
                                {registrationSettings.requireId && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                                            <CreditCard size={16} />
                                            ID
                                        </label>
                                        <input
                                            type="text"
                                            value={participantIdField}
                                            onChange={(e) => setParticipantIdField(e.target.value)}
                                            placeholder="Kimlik numaranız"
                                            className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-white placeholder:text-white/20 text-lg"
                                            required
                                        />
                                    </div>
                                )}

                                {/* KVKK Consent */}
                                {registrationSettings.requireKvkkConsent && (
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="kvkkConsent"
                                            checked={kvkkConsent}
                                            onChange={() => setKvkkConsent(true)}
                                            disabled
                                            className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-indigo-500 checked:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                                            required
                                        />
                                        <div className="min-w-0">
                                            <label htmlFor="kvkkConsent" className="text-sm text-white/70 flex gap-2 leading-snug cursor-pointer">
                                                <span className="mt-0.5 shrink-0">
                                                    <FileCheck size={16} />
                                                </span>
                                                <span className="min-w-0">
                                                    <a
                                                        href="/kvkk"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-white/90 underline underline-offset-2 hover:text-white"
                                                    >
                                                        KVKK
                                                    </a>{' '}
                                                    Aydınlatma ve{' '}
                                                    <a
                                                        href="/acik-riza"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-white/90 underline underline-offset-2 hover:text-white"
                                                    >
                                                        Açık Rıza Metni'ni
                                                    </a>{' '}
                                                    okudum, anladım ve onaylıyorum.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={
                                pin.length !== 6 || 
                                loading || 
                                loadingSettings ||
                                (registrationSettings?.requireName && !registrationSettings?.allowAnonymous && !name) ||
                                (registrationSettings?.requireEmail && !email) ||
                                (registrationSettings?.requirePhone && !phone) ||
                                (registrationSettings?.requireId && !participantIdField) ||
                                (registrationSettings?.requireAvatar && !avatar && !isMobile) ||
                                (registrationSettings?.requireKvkkConsent && !kvkkConsent)
                            }
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Katılınıyor...
                                </span>
                            ) : (
                                '🚀 Katıl'
                            )}
                        </button>

                    </form>
                </div>

                <div className="text-center mt-6 text-white/30 text-xs">
                    KS İnteraktif &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}

// Loading fallback component
function JoinPageLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
    );
}

// Main export with Suspense wrapper
export default function JoinPage() {
    return (
        <Suspense fallback={<JoinPageLoading />}>
            <JoinPageContent />
        </Suspense>
    );
}
