import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import MobileLayout from "../components/layout/MobileLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "KS İnteraktif Play",
    description: "Katılımcı Ekranı",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

import { TRPCProvider } from "../components/providers/TRPCProvider";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body className={inter.className}>
                <TRPCProvider>
                    <MobileLayout>{children}</MobileLayout>
                </TRPCProvider>
            </body>
        </html>
    );
}
