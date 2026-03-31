"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trpc } from "../../../utils/trpc";

export default function VerifyEmailClient({ token }: { token: string }) {
    const [message, setMessage] = useState<string>("Doğrulanıyor...");

    const verifyMutation = trpc.auth.verifyEmail.useMutation({
        onSuccess: () => setMessage("E-posta doğrulandı. Artık giriş yapabilirsin."),
        onError: (err) => setMessage(err.message),
    });

    useEffect(() => {
        if (!token) {
            setMessage("Doğrulama bağlantısı geçersiz.");
            return;
        }
        verifyMutation.mutate({ token });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">E-posta Doğrulama</h1>
                <p className="text-gray-600 mt-3">{message}</p>
                <div className="mt-6">
                    <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        </div>
    );
}
