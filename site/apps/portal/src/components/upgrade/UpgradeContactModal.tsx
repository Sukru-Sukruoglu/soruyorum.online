"use client";

import { useEffect, useMemo } from "react";
import { X, Mail, Phone } from "lucide-react";

function parsePhones(raw: string): string[] {
    return String(raw)
        .split(/\s*[|,/]\s*/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

export function UpgradeContactModal({
    open,
    onClose,
    title = "Premium için İletişim",
    subtitle = "Yükseltme için bizimle iletişime geçin.",
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
}) {
    const contact = useMemo(() => {
        const email = process.env.NEXT_PUBLIC_UPGRADE_CONTACT_EMAIL || "bilgi@keypadsistem.com";
        const phonesRaw =
            process.env.NEXT_PUBLIC_UPGRADE_CONTACT_PHONES ||
            process.env.NEXT_PUBLIC_UPGRADE_CONTACT_PHONE ||
            "+90 212 503 39 39";
        const phones = parsePhones(phonesRaw);
        const address =
            process.env.NEXT_PUBLIC_UPGRADE_CONTACT_ADDRESS ||
            "Kavacık, Fatih Sultan Mehmet Cd. Tonoğlu Plaza No:3 Kat:4, 34810 Beykoz/İstanbul";

        return { email, phones, address };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <div className="text-lg font-extrabold text-gray-900">{title}</div>
                        <div className="text-sm text-gray-500">{subtitle}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3"
                    >
                        <Mail size={18} className="text-red-600" />
                        <div>
                            <div className="text-xs text-gray-500">E-posta</div>
                            <div className="font-semibold text-gray-900">{contact.email}</div>
                        </div>
                    </a>

                    {contact.phones.map((phone) => (
                        <a
                            key={phone}
                            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3"
                        >
                            <Phone size={18} className="text-red-600" />
                            <div>
                                <div className="text-xs text-gray-500">Telefon</div>
                                <div className="font-semibold text-gray-900">{phone}</div>
                            </div>
                        </a>
                    ))}

                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                        <div className="text-xs text-gray-500">Adres</div>
                        <div className="text-sm text-gray-800 mt-1">{contact.address}</div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                const phonesText = contact.phones.length ? contact.phones.join(" / ") : "";
                                const text = `E-posta: ${contact.email}\nTelefon: ${phonesText}\nAdres: ${contact.address}`;
                                void navigator.clipboard?.writeText(text);
                            }}
                            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3"
                        >
                            Bilgileri Kopyala
                        </button>
                        <div className="text-xs text-gray-500 mt-2 text-center">ESC ile kapatabilirsiniz.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
