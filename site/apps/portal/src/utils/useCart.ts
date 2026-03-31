"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    clearCart,
    getCartTotal,
    getCheckoutAddonIds,
    getPrimaryPackage,
    readStoredCart,
    subscribeToCart,
    normalizeCart,
    replaceCart,
    type CartState,
} from "@/lib/cart";
import { fetchPortalAuthSession } from "@/utils/authSession";
import { trpc } from "@/utils/trpc";

function isCartEmpty(cart: CartState) {
    return cart.lines.length === 0;
}

function pickPreferredCart(localCart: CartState, remoteCart: CartState | null): CartState {
    if (!remoteCart) return localCart;
    if (isCartEmpty(localCart)) return remoteCart;
    if (isCartEmpty(remoteCart)) return localCart;

    const localTime = Date.parse(localCart.updatedAt || "");
    const remoteTime = Date.parse(remoteCart.updatedAt || "");

    if (Number.isFinite(remoteTime) && (!Number.isFinite(localTime) || remoteTime > localTime)) {
        return remoteCart;
    }

    return localCart;
}

function getCartSignature(cart: CartState) {
    return JSON.stringify({
        version: cart.version,
        currency: cart.currency,
        lines: cart.lines,
    });
}

export function useCart() {
    const [cart, setCart] = useState<CartState>(readStoredCart());
    const [ready, setReady] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [remoteReady, setRemoteReady] = useState(false);
    const lastPersistedSignatureRef = useRef<string>(getCartSignature(cart));

    const utils = trpc.useUtils();
    const getCartDraftQuery = trpc.users.getCartDraft.useQuery(undefined, {
        enabled: authReady && isAuthenticated,
        retry: false,
        staleTime: 15000,
    });
    const updateCartDraftMutation = trpc.users.updateCartDraft.useMutation({
        onSuccess: () => {
            void utils.users.getCartDraft.invalidate();
        },
    });

    useEffect(() => {
        setCart(readStoredCart());
        setReady(true);

        return subscribeToCart((nextCart) => {
            setCart(nextCart);
            setReady(true);
        });
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncAuth = () => {
            void fetchPortalAuthSession()
                .then((session) => {
                    setIsAuthenticated(session.authenticated);
                    setAuthReady(true);
                })
                .catch(() => {
                    setIsAuthenticated(false);
                    setAuthReady(true);
                });
        };

        syncAuth();
        window.addEventListener("storage", syncAuth);

        return () => {
            window.removeEventListener("storage", syncAuth);
        };
    }, []);

    useEffect(() => {
        if (!authReady) return;

        if (!isAuthenticated) {
            setRemoteReady(true);
            return;
        }

        if (getCartDraftQuery.isLoading) {
            return;
        }

        const remoteCart = getCartDraftQuery.data?.cartDraft ? normalizeCart(getCartDraftQuery.data.cartDraft) : null;
        const preferredCart = pickPreferredCart(readStoredCart(), remoteCart);
        const currentSignature = getCartSignature(readStoredCart());
        const preferredSignature = getCartSignature(preferredCart);

        if (preferredSignature !== currentSignature) {
            replaceCart(preferredCart);
            setCart(preferredCart);
        }
        lastPersistedSignatureRef.current = preferredSignature;
        setRemoteReady(true);
    }, [authReady, getCartDraftQuery.data, getCartDraftQuery.isLoading, isAuthenticated]);

    useEffect(() => {
        if (!ready || !authReady || !remoteReady || !isAuthenticated) {
            return;
        }

        const signature = getCartSignature(normalizeCart(cart));
        if (signature === lastPersistedSignatureRef.current) {
            return;
        }

        lastPersistedSignatureRef.current = signature;
        updateCartDraftMutation.mutate({ cartDraft: normalizeCart(cart) });
        // Intentionally fire-and-forget to keep the cart local-first.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, cart, isAuthenticated, ready, remoteReady]);

    const lineCount = cart.lines.length;
    const itemCount = useMemo(
        () => cart.lines.reduce((sum, line) => sum + line.quantity, 0),
        [cart.lines],
    );
    const total = useMemo(() => getCartTotal(cart), [cart]);
    const packageLine = useMemo(() => getPrimaryPackage(cart), [cart]);
    const addonIds = useMemo(() => getCheckoutAddonIds(cart), [cart]);

    return {
        cart,
        ready: ready && remoteReady,
        lineCount,
        itemCount,
        total,
        packageLine,
        addonIds,
        clear: () => clearCart(),
        isAuthenticated,
    };
}