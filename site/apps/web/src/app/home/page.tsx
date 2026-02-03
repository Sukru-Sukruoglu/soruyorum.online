import { Hero } from "../../components/sections/Hero";
import { Features } from "../../components/sections/Features";
import { About } from "../../components/sections/About";
import { GamesShowcase } from "../../components/sections/GamesShowcase";
import { Pricing } from "../../components/sections/Pricing";
import { Testimonials } from "../../components/sections/Testimonials";
import { CTA } from "../../components/sections/CTA";
import { Hardware } from "../../components/sections/Hardware";

export default function Home() {
    return (
        <div className="flex flex-col gap-0">
            <Hero />
            <Features />
            <About />
            <Hardware />
            <GamesShowcase />
            <Pricing />
            <Testimonials />
            <CTA />
        </div>
    );
}
