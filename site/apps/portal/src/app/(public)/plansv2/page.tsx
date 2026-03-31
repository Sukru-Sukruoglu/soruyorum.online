import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlansV2Client from "./PlansV2Client";

type PlansV2PageProps = {
    searchParams: Promise<{ preview?: string }>;
};

export const metadata: Metadata = {
    title: "Fiyatlandirma V2 Taslagi",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function PlansV2Page({ searchParams }: PlansV2PageProps) {
    const token = process.env.PRICING_PREVIEW_TOKEN || "12345";
    const params = await searchParams;

    if (params.preview !== token) {
        notFound();
    }

    return <PlansV2Client />;
}
