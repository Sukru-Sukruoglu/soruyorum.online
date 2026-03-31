import { notFound } from "next/navigation";
import PlansClient from "./PlansClient";

export default function PlansPage() {
    // Keep the feature in the codebase, but hide it from users unless explicitly enabled.
    if (process.env.PUBLIC_PLANS_ENABLED !== "true") {
        notFound();
    }
    return <PlansClient />;
}
