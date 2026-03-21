import type { Metadata } from "next";
import { MarketingAboutStaticSections } from "@/components/marketing/MarketingAboutStaticSections";
import { MarketingMainHeader } from "@/components/marketing/MarketingMainHeader";
import { MarketingPageChrome } from "@/components/marketing/MarketingPageChrome";
import { getMarketingNavUser } from "@/lib/getMarketingNavUser";

export const metadata: Metadata = {
  title: "Hakkımızda | SoruYorum.Online",
  description:
    "SoruYorum.Online ekibi ve deneyimi. 2006'dan bu yana interaktif toplantı ve etkinlik çözümleri.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AboutPage() {
  const initialNavUser = await getMarketingNavUser();
  return (
    <MarketingPageChrome>
      <MarketingMainHeader navMode="about" initialNavUser={initialNavUser} />
      <MarketingAboutStaticSections />
    </MarketingPageChrome>
  );
}
