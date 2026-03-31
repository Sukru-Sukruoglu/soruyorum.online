import { MarketingLandingAbout } from "./MarketingLandingAbout";
import { MarketingLandingContact } from "./MarketingLandingContact";
import { MarketingLandingMainSlider } from "./MarketingLandingMainSlider";
import { MarketingLandingNewsletter } from "./MarketingLandingNewsletter";
import { MarketingLandingPortfolio } from "./MarketingLandingPortfolio";
import { MarketingLandingProcess } from "./MarketingLandingProcess";
import { MarketingLandingServices } from "./MarketingLandingServices";
import { MarketingLandingSiteFooter } from "./MarketingLandingSiteFooter";
import { MarketingLandingSlidingText } from "./MarketingLandingSlidingText";
import { MarketingLandingWhyChoose } from "./MarketingLandingWhyChoose";

export function MarketingLandingContent() {
    return (
        <>
            <MarketingLandingMainSlider />
            <MarketingLandingAbout />
            <MarketingLandingServices />
            <MarketingLandingPortfolio />
            <MarketingLandingWhyChoose />
            <MarketingLandingSlidingText />
            <MarketingLandingProcess />
            <MarketingLandingContact />
            <MarketingLandingNewsletter />
            <MarketingLandingSiteFooter />
        </>
    );
}
