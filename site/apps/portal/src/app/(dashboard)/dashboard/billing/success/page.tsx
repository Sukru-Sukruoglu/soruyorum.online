"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
    return (
        <div className="p-8">
            <div className="max-w-2xl rounded-2xl border border-green-200 bg-green-50 p-8 text-green-900">
                <div className="flex items-start gap-3">
                    <CheckCircle2 size={24} className="mt-0.5" />
                    <div>
                        <h1 className="text-2xl font-black">Ödeme alındı</h1>
                        <p className="mt-2 text-sm text-green-800">
                            Ödemeniz başarıyla alındı. Premium erişiminiz kısa süre içinde aktive olacaktır.
                        </p>
                        <div className="mt-6">
                            <Link href="/dashboard/billing" className="text-sm font-semibold text-green-900 underline">
                                Premium durumunu kontrol et
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
