"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@ks-interaktif/ui";
import { trpc } from "../../../utils/trpc";

export default function CheckEmailClient({ email }: { email: string }) {
    const [status, setStatus] = useState<string | null>(null);

    const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
        onSuccess: () => setStatus("Doğrulama e-postası tekrar gönderildi (eğer bu e-posta kayıtlıysa)."),
        onError: (err) => setStatus(err.message),
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">E-postanı kontrol et</h1>
                <p className="text-gray-600 mt-3">
                    Hesabını kullanabilmek için e-posta adresini doğrulaman gerekiyor. Gelen kutunu (ve spam/junk klasörünü)
                    kontrol et.
                </p>

                {email ? (
                    <p className="text-sm text-gray-500 mt-3">
                        E-posta: <span className="font-semibold text-gray-800">{email}</span>
                    </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3">
                    <Button
                        className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white"
                        disabled={!email || resendMutation.isPending}
                        onClick={() => resendMutation.mutate({ email })}
                    >
                        {resendMutation.isPending ? "Gönderiliyor..." : "Doğrulama e-postasını tekrar gönder"}
                    </Button>

                    <Link href="/login" className="text-center text-sm text-gray-600 hover:text-gray-900">
                        Giriş sayfasına dön
                    </Link>
                </div>

                {status ? <div className="mt-4 text-sm text-gray-700">{status}</div> : null}
            </div>
        </div>
    );
}
