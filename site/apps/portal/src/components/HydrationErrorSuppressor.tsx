"use client";

import { useEffect } from "react";

/**
 * Suppresses React hydration mismatch console errors in production.
 *
 * These errors are typically caused by:
 * - Browser extensions (Google Translate, Grammarly, ad blockers, etc.)
 *   injecting/modifying DOM elements between server render and client hydration.
 * - Third-party scripts altering the DOM.
 *
 * The errors are cosmetic – they don't affect functionality,
 * but they clutter the production console.
 */
export function HydrationErrorSuppressor() {
    useEffect(() => {
        // Only patch in production
        if (process.env.NODE_ENV !== "production") return;

        const originalError = console.error;

        console.error = (...args: unknown[]) => {
            // Check if this is a React hydration error
            const msg = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");

            // Suppress known React hydration mismatch errors
            if (
                msg.includes("Minified React error #418") ||
                msg.includes("Minified React error #423") ||
                msg.includes("Minified React error #425") ||
                msg.includes("Text content does not match") ||
                msg.includes("Hydration failed because") ||
                msg.includes("There was an error while hydrating")
            ) {
                // Silently ignore – these are caused by browser extensions
                return;
            }

            // Pass through all other errors
            originalError.apply(console, args);
        };

        // Cleanup
        return () => {
            console.error = originalError;
        };
    }, []);

    return null;
}
