"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { trpc } from "../../../../utils/trpc";
import { QandaModerator } from "../../../../components/events/QandaModerator";
import { bootstrapPortalSession } from "../../../../utils/authSession";

export default function TabletEventModeratorPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const eventId = params.id as string;
    const token = searchParams.get("t");
    const hasBootstrapToken = Boolean(token && token.trim());

    // If a short-lived token is provided, upgrade it into a secure httpOnly session cookie.
    useEffect(() => {
        if (!hasBootstrapToken || !token) return;
        void bootstrapPortalSession(token)
            .catch(() => {
                // Ignore here; page query will fail and show its own auth error state.
            })
            .finally(() => {
                // Remove token from URL (prevents re-sharing from address bar)
                window.location.replace(window.location.pathname);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasBootstrapToken, token]);

    const { data: event, isLoading, isError, error } = trpc.events.getById.useQuery(eventId, {
        enabled: !hasBootstrapToken,
        retry: false,
    });

    useEffect(() => {
        const message = (error?.message || "").toUpperCase();
        const code = (error as any)?.data?.code;
        if (isError && (message.includes("UNAUTHORIZED") || code === "UNAUTHORIZED")) {
            router.replace("/login");
        }
    }, [isError, error, router]);

    if (hasBootstrapToken) {
        return <div className="text-center py-12 text-gray-500">Oturum hazırlanıyor...</div>;
    }

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
    }

    if (isError) {
        return (
            <div className="max-w-xl mx-auto py-12 px-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Erişim Hatası</h3>
                    <p className="text-gray-600 mb-4">
                        {error?.message?.includes("UNAUTHORIZED")
                            ? "QR süresi dolmuş olabilir. Portal ekranından QR’ı yenileyip tekrar okutun."
                            : error?.message || "Bir hata oluştu."}
                    </p>
                    <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                        Giriş Sayfasına Git →
                    </Link>
                </div>
            </div>
        );
    }

    if (!event) {
        return <div className="text-center py-12 text-gray-500">Etkinlik bulunamadı.</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <QandaModerator
                eventId={eventId}
                eventPin={(event as any).eventPin || (event as any).event_pin || ""}
                mode="tablet"
                showPresentationButton={false}
            />
        </div>
    );
}
