import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
    title: "KS İnteraktif",
    description: "İnteraktif Etkinlik Platformu",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" className="scroll-smooth">
            <body className={`${inter.className} ${spaceGrotesk.variable}`}>
                {children}
            </body>
        </html>
    );
}
