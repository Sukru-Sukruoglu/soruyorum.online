"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TabletHomePage() {
    const router = useRouter();
    const [eventId, setEventId] = useState("");

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-black text-gray-900">Tablet Yönetim</h1>
                <p className="text-gray-600 mt-2">
                    Bu ekran tablet.soruyorum.online için. Etkinliği açmak için linki kullanın:
                    <span className="block mt-1 font-mono text-sm text-gray-800 break-all">/events/&lt;eventId&gt;</span>
                </p>

                <div className="mt-6">
                    <label className="text-sm font-semibold text-gray-700">Etkinlik ID</label>
                    <div className="mt-2 flex gap-2">
                        <input
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            placeholder="Örn: 20018e7f-..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const id = eventId.trim();
                                if (!id) return;
                                router.push(`/events/${encodeURIComponent(id)}`);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            Aç
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Not: Tablet domaininde /events/&lt;id&gt; otomatik olarak /tablet/events/&lt;id&gt; görünümüne yönlenir.
                    </p>
                </div>
            </div>
        </div>
    );
}
