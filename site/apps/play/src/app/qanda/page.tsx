"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { Button } from "@ks-interaktif/ui";
import { ArrowLeft, Send, MessageSquare, CheckCircle2, Clock, LogOut } from "lucide-react";


function QandaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [questionText, setQuestionText] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("connected");

    // Get identity from URL or LocalStorage
    const name = searchParams.get("name") || (typeof window !== 'undefined' ? localStorage.getItem('participantName') : "") || "Anonim";
    const eventId = searchParams.get("eventId") || (typeof window !== 'undefined' ? localStorage.getItem('eventId') : "");
    const participantId = searchParams.get("participantId") || (typeof window !== 'undefined' ? localStorage.getItem('participantId') : "");
    const sessionId = searchParams.get("sessionId") || (typeof window !== 'undefined' ? localStorage.getItem('sessionId') : "");

    // If a user refreshes and the session is missing, send them to join directly.
    useEffect(() => {
        if (!eventId || !participantId) {
            router.replace('/join');
        }
    }, [eventId, participantId, router]);

    const handleLogout = async () => {
        // Mark as left so moderator list removes the participant
        try {
            if (participantId && eventId) {
                await fetch('/api/public/leave', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId, eventId }),
                });
            }
        } catch {
            // ignore
        }

        try {
            localStorage.removeItem('participantName');
            localStorage.removeItem('eventId');
            localStorage.removeItem('participantId');
            localStorage.removeItem('sessionId');
        } catch {
            // ignore
        }
        router.push('/join');
    };

    // Save to LocalStorage if present in URL
    if (typeof window !== 'undefined') {
        if (searchParams.get("name")) localStorage.setItem('participantName', searchParams.get("name")!);
        if (searchParams.get("eventId")) localStorage.setItem('eventId', searchParams.get("eventId")!);
        if (searchParams.get("participantId")) localStorage.setItem('participantId', searchParams.get("participantId")!);
        if (searchParams.get("sessionId")) localStorage.setItem('sessionId', searchParams.get("sessionId")!);
    }

    if (!eventId || !participantId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
                <h1 className="text-xl font-bold text-gray-900 mb-2">Oturum Bulunamadı</h1>
                <p className="text-gray-500 mb-6">Lütfen etkinliğe tekrar giriş yapın.</p>
                <Button className="bg-indigo-600 text-white" onClick={() => window.location.href = `/join`}>
                    Giriş Sayfasına Git
                </Button>
            </div>
        );
    }

    const submitQuestion = trpc.qanda.submitQuestion.useMutation({
        onSuccess: () => {
            setIsSubmitted(true);
            setQuestionText("");
            refetch(); // Refresh list instantly
            setTimeout(() => setIsSubmitted(false), 3000);
        }
    });

    // Polling for questions (5s)
    const { data: myQuestions, refetch } = trpc.qanda.getQuestions.useQuery({
        eventId,
        participantId // Only show my questions? Or all? API usually filters. Assuming we want to filter by my questions for this view if the API supported it, but getQuestions returns all by default or filtered by status.
        // The legacy guide says: "Soru Gönder" view polls "presentations/active" and "questions".
        // Let's assume we want to see OUR questions status.
        // Current `getQuestions` router likely returns all. We might need to filter client side if the API doesn't support filtering by participant.
        // For now, client side filtering for "My Questions" section.
    }, {
        refetchInterval: 5000
    });

    // Filter for my questions
    const myQuestionsFiltered = myQuestions?.filter((q: any) => q.participantName === name) || [];

    // Heartbeat (30s)
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                // We need a direct fetch because Heartbeat might not be in TRPC router or we want lightweight call
                // But we used `apiClient` in Portal. Play app might need its own client or use fetch.
                // Let's use fetch to the API server URL.
                await fetch('/api/public/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId, eventId })
                });
                setConnectionStatus("connected");
            } catch (err) {
                console.error("Heartbeat failed", err);
                setConnectionStatus("disconnected");
            }
        };

        // Initial call
        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, 30000);
        return () => clearInterval(interval);
    }, [participantId, eventId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;

        submitQuestion.mutate({
            eventId,
            participantName: name,
            questionText: questionText.trim(),
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-6 sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Soru Sor</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Katılımcı</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <p className="text-sm font-bold text-indigo-600">{name}</p>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50"
                        >
                            <LogOut size={14} /> Çıkış
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-6 space-y-8 overflow-y-auto">
                {/* Form Section */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-indigo-500/5 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Yeni Soru Sor</h2>
                            <p className="text-xs text-gray-500">Sorunuz moderatör onayından sonra ekrana yansıyacaktır.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Soru metnini buraya yazın..."
                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-gray-900 font-medium placeholder:text-gray-400"
                        />
                        <Button
                            type="submit"
                            disabled={!questionText.trim() || submitQuestion.isLoading}
                            className={`w-full h-14 rounded-2xl gap-2 font-bold text-lg transition-all ${isSubmitted
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            {submitQuestion.isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isSubmitted ? (
                                <>
                                    <CheckCircle2 size={24} /> Gönderildi
                                </>
                            ) : (
                                <>
                                    <Send size={20} /> Gönder
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* My Questions Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] px-2">Sorularım</h3>
                    <div className="space-y-3">
                        {myQuestionsFiltered && myQuestionsFiltered.length > 0 ? (
                            myQuestionsFiltered.map((q: any) => (
                                <div key={q.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-xl border ${q.status === 'approved'
                                        ? "bg-green-50 border-green-100 text-green-600"
                                        : q.status === 'rejected'
                                            ? "bg-red-50 border-red-100 text-red-600"
                                            : "bg-yellow-50 border-yellow-100 text-yellow-600"
                                        }`}>
                                        {q.status === 'approved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-medium leading-relaxed">{q.questionText}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${q.status === 'approved'
                                                ? "bg-green-100 text-green-700"
                                                : q.status === 'rejected'
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {q.status === 'approved' ? 'Onaylandı' : q.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold">
                                                {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                                <p className="text-gray-400 font-medium">Henüz soru göndermediniz.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function QandaPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">Yükleniyor...</div>}>
            <QandaContent />
        </Suspense>
    );
}
