import "./globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat"
});

export const metadata: Metadata = {
    title: "KS İnteraktif Portal",
    description: "Organizasyon Yönetim Paneli",
};

import Providers from "./providers";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body className={`${montserrat.variable} font-sans bg-black text-white`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
