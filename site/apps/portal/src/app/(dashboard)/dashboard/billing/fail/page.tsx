"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function BillingFailPage() {
    return (
        <div className="p-8">
            <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
                <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="mt-0.5" />
                    <div>
                        <h1 className="text-2xl font-black">Ödeme tamamlanamadı</h1>
                        <p className="mt-2 text-sm text-red-800">
                            İşlem iptal edildi veya başarısız oldu. Tekrar deneyebilirsiniz.
                        </p>
                        <div className="mt-6">
                            <Link href="/dashboard/billing" className="text-sm font-semibold text-red-900 underline">
                                Ödeme ekranına geri dön
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
