"use client";

import { useEffect } from "react";

declare global {
    interface Window {
        thmSwiperInit?: () => void;
    }
}

/**
 * Load a script by appending a <script> tag to <body>.
 * Returns a promise that resolves when the script finishes loading.
 */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Skip if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = false; // maintain order within a batch
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
    });
}

/**
 * Load an array of scripts in parallel, wait for all.
 */
function loadScripts(srcs: string[]): Promise<void[]> {
    return Promise.all(srcs.map(loadScript));
}

const JQUERY_SCRIPTS = ["/assets/js/jquery-3.6.0.min.js"];

const PLUGIN_SCRIPTS = [
    "/assets/js/bootstrap.bundle.min.js",
    "/assets/js/jarallax.min.js",
    "/assets/js/jquery.ajaxchimp.min.js",
    "/assets/js/jquery.appear.min.js",
    "/assets/js/swiper.min.js",
    "/assets/js/jquery.magnific-popup.min.js",
    "/assets/js/jquery.validate.min.js",
    "/assets/js/odometer.min.js",
    "/assets/js/wNumb.min.js",
    "/assets/js/wow.js",
    "/assets/js/isotope.js",
    "/assets/js/owl.carousel.min.js",
    "/assets/js/jquery-ui.js",
    "/assets/js/jquery.nice-select.min.js",
    "/assets/js/twentytwenty.js",
    "/assets/js/jquery.event.move.js",
    "/assets/js/marquee.min.js",
    "/assets/js/jquery.circleType.js",
    "/assets/js/jquery.fittext.js",
    "/assets/js/jquery.lettering.min.js",
    "/assets/js/typed-2.0.11.js",
    "/assets/js/jquery-sidebar-content.js",
    "/assets/js/aos.js",
    "/assets/js/countdown.min.js",
];

const GSAP_SCRIPTS = [
    "/assets/js/gsap/gsap.js",
    "/assets/js/gsap/ScrollTrigger.js",
    "/assets/js/gsap/SplitText.js",
];

const MAIN_SCRIPT = "/assets/js/script.js?v=20260219a";

export function PreloaderDismissal() {
    useEffect(() => {
        // 1. Dismiss preloader immediately
        const preloader = document.querySelector(".js-preloader");
        if (preloader) {
            const el = preloader as HTMLElement;
            setTimeout(() => {
                el.style.transition = "opacity 0.5s ease";
                el.style.opacity = "0";
                setTimeout(() => { el.style.display = "none"; }, 500);
            }, 100);
        }

        // 2. Load scripts sequentially AFTER React hydration
        let cancelled = false;

        (async () => {
            try {
                // Step A: jQuery must load first (everything else depends on $)
                await loadScripts(JQUERY_SCRIPTS);
                if (cancelled) return;

                // Step B: Load plugins + GSAP in parallel
                await Promise.all([
                    loadScripts(PLUGIN_SCRIPTS),
                    loadScripts(GSAP_SCRIPTS),
                ]);
                if (cancelled) return;

                // Step C: Load main script.js last (needs all plugins ready)
                await loadScript(MAIN_SCRIPT);
                if (cancelled) return;

                // Step D: Initialize Swiper if available
                if (window.thmSwiperInit) {
                    window.thmSwiperInit();
                }
            } catch (err) {
                console.warn("[PreloaderDismissal] Script load error:", err);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return null;
}
