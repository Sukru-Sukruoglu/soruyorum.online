import { getMarketingNavUser } from "@/lib/getMarketingNavUser";
import { MarketingLandingContent } from "@/components/marketing/landing/MarketingLandingContent";
import { MarketingMainHeader } from "@/components/marketing/MarketingMainHeader";
import { MarketingPageChrome } from "@/components/marketing/MarketingPageChrome";

export { metadata } from "./landing-page-metadata";

export default async function LandingPage() {
    const initialNavUser = await getMarketingNavUser();
    return (
        <MarketingPageChrome>
            <MarketingMainHeader navMode="home" initialNavUser={initialNavUser} />
            <MarketingLandingContent />
        </MarketingPageChrome>
    );
}
