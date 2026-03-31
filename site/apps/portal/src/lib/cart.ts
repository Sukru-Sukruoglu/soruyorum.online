export const CART_STORAGE_KEY = "soruyorum.portal.cart.v1";
export const CART_UPDATED_EVENT = "soruyorum:cart-updated";

export const CHECKOUT_ADDON_IDS = ["addon_remote", "addon_onsite"] as const;

export type CheckoutAddonId = (typeof CHECKOUT_ADDON_IDS)[number];
export type CartLineKind = "package" | "addon";

export type CartLine = {
    key: string;
    kind: CartLineKind;
    productId: string;
    title: string;
    description?: string;
    features?: string[];
    price: number;
    quantity: number;
    removable?: boolean;
    checkout?: {
        packageId?: string;
        addonId?: string;
    };
};

export type CartState = {
    version: 1;
    currency: "TRY";
    lines: CartLine[];
    updatedAt: string;
};

export type CartPackageInput = {
    productId: string;
    title: string;
    description?: string;
    features?: string[];
    price: number;
};

export type CartAddonInput = {
    addonId: string;
    title: string;
    description?: string;
    price: number;
};

function nowIso() {
    return new Date().toISOString();
}

export function createEmptyCart(): CartState {
    return {
        version: 1,
        currency: "TRY",
        lines: [],
        updatedAt: nowIso(),
    };
}

function normalizeLine(raw: unknown): CartLine | null {
    if (!raw || typeof raw !== "object") return null;

    const candidate = raw as Partial<CartLine>;
    const kind = candidate.kind === "package" || candidate.kind === "addon" ? candidate.kind : null;
    const key = typeof candidate.key === "string" ? candidate.key : "";
    const productId = typeof candidate.productId === "string" ? candidate.productId : "";
    const title = typeof candidate.title === "string" ? candidate.title : "";
    const price = typeof candidate.price === "number" && Number.isFinite(candidate.price) ? candidate.price : NaN;
    const quantity = typeof candidate.quantity === "number" && candidate.quantity > 0 ? Math.floor(candidate.quantity) : 1;

    if (!kind || !key || !productId || !title || Number.isNaN(price)) {
        return null;
    }

    return {
        key,
        kind,
        productId,
        title,
        description: typeof candidate.description === "string" ? candidate.description : undefined,
        features: Array.isArray(candidate.features)
            ? candidate.features.filter((value): value is string => typeof value === "string")
            : undefined,
        price,
        quantity,
        removable: Boolean(candidate.removable),
        checkout: candidate.checkout && typeof candidate.checkout === "object"
            ? {
                packageId: typeof candidate.checkout.packageId === "string" ? candidate.checkout.packageId : undefined,
                addonId: typeof candidate.checkout.addonId === "string" ? candidate.checkout.addonId : undefined,
            }
            : undefined,
    };
}

export function normalizeCart(raw: unknown): CartState {
    if (!raw || typeof raw !== "object") {
        return createEmptyCart();
    }

    const candidate = raw as Partial<CartState>;
    const lines = Array.isArray(candidate.lines)
        ? candidate.lines.map((line) => normalizeLine(line)).filter((line): line is CartLine => Boolean(line))
        : [];

    const dedupedLines = new Map<string, CartLine>();
    for (const line of lines) {
        dedupedLines.set(line.key, line);
    }

    return {
        version: 1,
        currency: "TRY",
        lines: Array.from(dedupedLines.values()),
        updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : nowIso(),
    };
}

export function readStoredCart(): CartState {
    if (typeof window === "undefined") {
        return createEmptyCart();
    }

    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return createEmptyCart();
        return normalizeCart(JSON.parse(raw));
    } catch {
        return createEmptyCart();
    }
}

export function writeStoredCart(nextCart: CartState): CartState {
    const normalized = normalizeCart({
        ...nextCart,
        updatedAt: nowIso(),
    });

    if (typeof window !== "undefined") {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
        window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: normalized }));
    }

    return normalized;
}

export function subscribeToCart(onChange: (cart: CartState) => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key && event.key !== CART_STORAGE_KEY) {
            return;
        }
        onChange(readStoredCart());
    };

    const handleCustomEvent = (event: Event) => {
        const customEvent = event as CustomEvent<CartState | undefined>;
        onChange(customEvent.detail ? normalizeCart(customEvent.detail) : readStoredCart());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CART_UPDATED_EVENT, handleCustomEvent as EventListener);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(CART_UPDATED_EVENT, handleCustomEvent as EventListener);
    };
}

export function replaceCart(nextCart: CartState): CartState {
    return writeStoredCart(nextCart);
}

export function clearCart(): CartState {
    return writeStoredCart(createEmptyCart());
}

export function setPackageLine(cart: CartState, input: CartPackageInput): CartState {
    const normalized = normalizeCart(cart);
    const otherLines = normalized.lines.filter((line) => line.kind !== "package");

    return {
        ...normalized,
        lines: [
            {
                key: `package:${input.productId}`,
                kind: "package",
                productId: input.productId,
                title: input.title,
                description: input.description,
                features: input.features,
                price: input.price,
                quantity: 1,
                removable: false,
                checkout: {
                    packageId: input.productId,
                },
            },
            ...otherLines,
        ],
        updatedAt: nowIso(),
    };
}

export function setAddonEnabled(cart: CartState, input: CartAddonInput, enabled: boolean): CartState {
    const normalized = normalizeCart(cart);
    const nextLines = normalized.lines.filter((line) => line.key !== `addon:${input.addonId}`);

    if (enabled) {
        nextLines.push({
            key: `addon:${input.addonId}`,
            kind: "addon",
            productId: input.addonId,
            title: input.title,
            description: input.description,
            price: input.price,
            quantity: 1,
            removable: true,
            checkout: {
                addonId: input.addonId,
            },
        });
    }

    return {
        ...normalized,
        lines: nextLines,
        updatedAt: nowIso(),
    };
}

export function removeCartLine(cart: CartState, key: string): CartState {
    const normalized = normalizeCart(cart);

    return {
        ...normalized,
        lines: normalized.lines.filter((line) => line.key !== key),
        updatedAt: nowIso(),
    };
}

export function getPrimaryPackage(cart: CartState): CartLine | null {
    return normalizeCart(cart).lines.find((line) => line.kind === "package") ?? null;
}

export function getCheckoutAddonIds(cart: CartState): CheckoutAddonId[] {
    return normalizeCart(cart).lines
        .map((line) => line.checkout?.addonId)
        .filter((value): value is CheckoutAddonId => Boolean(value) && (CHECKOUT_ADDON_IDS as readonly string[]).includes(value));
}

export function getCartTotal(cart: CartState): number {
    return normalizeCart(cart).lines.reduce((sum, line) => sum + (line.price * line.quantity), 0);
}