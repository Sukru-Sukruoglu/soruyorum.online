import type { Metadata } from "next";
import { getMarketingNavUser } from "@/lib/getMarketingNavUser";
import PricingPreviewClient from "./PricingPreviewClient";

export const metadata: Metadata = {
    title: "Fiyatlandırma",
    robots: {
        index: true,
        follow: true,
    },
};

export default async function PricingPreviewPage() {
    const initialNavUser = await getMarketingNavUser();
    return <PricingPreviewClient initialNavUser={initialNavUser} />;
}
