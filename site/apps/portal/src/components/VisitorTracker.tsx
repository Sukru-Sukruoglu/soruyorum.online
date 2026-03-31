"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL = 20_000;

/**
 * Generates or retrieves a tab-scoped anonymous visitor ID.
 * Stored in sessionStorage so each browser tab is tracked separately
 * while still surviving reloads within the same tab.
 */
function getVisitorId(): string {
    const KEY = "sy_vid";
    try {
        let id = sessionStorage.getItem(KEY);
        if (!id) {
            id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            sessionStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        // Fallback when web storage is unavailable
        return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
}

/**
 * Invisible component that sends periodic heartbeats to track
 * active visitors and their current page.
 * Placed in root layout so it runs on every page.
 */
export function VisitorTracker() {
    const pathname = usePathname();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const visitorIdRef = useRef<string>("");

    const sendHeartbeatRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        visitorIdRef.current = getVisitorId();
    }, []);

    useEffect(() => {
        if (!visitorIdRef.current) {
            visitorIdRef.current = getVisitorId();
        }

        const sendHeartbeat = (useBeacon = false) => {
            const body = JSON.stringify({
                visitorId: visitorIdRef.current,
                page: pathname,
                referrer: typeof document !== "undefined" ? document.referrer : undefined,
            });

            if (useBeacon && navigator.sendBeacon) {
                const blob = new Blob([body], { type: "application/json" });
                navigator.sendBeacon('/api/tracking/heartbeat', blob);
            } else {
                fetch('/api/tracking/heartbeat', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                    keepalive: true,
                }).catch(() => { });
            }
        };

        sendHeartbeatRef.current = () => sendHeartbeat(false);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                sendHeartbeat(false);
            }
        };

        const handlePageHide = () => {
            sendHeartbeat(true);
        };

        // Send immediately on page change
        sendHeartbeat(false);

        // Then send every 20 seconds
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => sendHeartbeat(false), HEARTBEAT_INTERVAL);

        window.addEventListener("focus", handleVisibilityChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pagehide", handlePageHide);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("focus", handleVisibilityChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, [pathname]);

    return null; // Invisible component
}
