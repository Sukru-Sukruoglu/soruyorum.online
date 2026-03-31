import type { PrismaClient } from "@ks-interaktif/database";

const TRIAL_DAYS = Number.parseInt(process.env.TRIAL_DAYS ?? "14", 10);
const SPRING_PILOT_PLAN = (process.env.SPRING_PILOT_PLAN ?? "spring_pilot_500").trim().toLowerCase();
export const DEFAULT_SIGNUP_PLAN = (process.env.DEFAULT_SIGNUP_PLAN ?? SPRING_PILOT_PLAN).trim().toLowerCase();
const SPRING_PILOT_START = process.env.SPRING_PILOT_START ?? "2026-04-01T00:00:00+03:00";
const SPRING_PILOT_END = process.env.SPRING_PILOT_END ?? "2026-04-30T23:59:59+03:00";
const SPRING_PILOT_ALLOW_EARLY_ACCESS = ["1", "true", "yes", "on"].includes(
    String(process.env.SPRING_PILOT_ALLOW_EARLY_ACCESS ?? "1").trim().toLowerCase(),
);

const DEFAULT_SUPERADMIN_ROLES = ["superadmin", "super_admin", "root", "system", "owner"];

function parseCsvEnv(name: string): string[] {
    const raw = process.env[name];
    if (!raw) return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export function isSuperAdmin(user: { role?: string | null; email?: string | null } | null | undefined): boolean {
    if (!user) return false;

    const role = (user.role ?? "").toString().trim().toLowerCase();
    const email = (user.email ?? "").toString().trim().toLowerCase();

    const roleAllow = parseCsvEnv("SUPERADMIN_ROLES").map((r) => r.toLowerCase());
    const roles = roleAllow.length > 0 ? roleAllow : DEFAULT_SUPERADMIN_ROLES;

    if (role && roles.includes(role)) return true;

    const emailAllow = parseCsvEnv("SUPERADMIN_EMAILS").map((e) => e.toLowerCase());
    if (email && emailAllow.includes(email)) return true;

    return false;
}

/**
 * Superadmin veya JuniorAdmin → plan/abonelik kısıtlamalarını atlar.
 * Yönetim paneli (kullanıcılar, billing-ops, monitoring, fiyatlandırma) için
 * yine isSuperAdmin kullanılmalıdır.
 */
export function hasFullAccess(user: { role?: string | null; email?: string | null } | null | undefined): boolean {
    if (isSuperAdmin(user)) return true;
    const role = (user?.role ?? "").toString().trim().toLowerCase();
    return role === "junioradmin";
}

/* ── Plan-Feature Mapping ── */
export type PlanFeatures = {
    maxParticipants: number;        // Aynı anda max kişi sayısı
    maxEvents: number | null;       // Toplam etkinlik hakkı (null = sınırsız)
    branding: boolean;              // Full branding dahil mi
    customDomain: boolean;          // Özel subdomain / domain
    whiteLabel: boolean;            // WL mi
    platformBranding: boolean;      // Platform logosu / watermark gosterilsin mi
};

const PLAN_FEATURES: Record<string, PlanFeatures> = {
    free:               { maxParticipants: 50,   maxEvents: null, branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    spring_pilot_500:   { maxParticipants: 500,  maxEvents: null, branding: true,  customDomain: false, whiteLabel: false, platformBranding: false },
    event_starter:      { maxParticipants: 100,  maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    event_standard:     { maxParticipants: 500,  maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    event_professional: { maxParticipants: 2000, maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    starter_wl:         { maxParticipants: 100,  maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    standard_wl:        { maxParticipants: 500,  maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    professional_wl:    { maxParticipants: 2000, maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    event_pack_5:       { maxParticipants: 500,  maxEvents: 5,    branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    event_pack_10:      { maxParticipants: 500,  maxEvents: 10,   branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    event_pack_wl_5:    { maxParticipants: 2000, maxEvents: 5,    branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    event_pack_wl_10:   { maxParticipants: 2000, maxEvents: 10,   branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    corporate:          { maxParticipants: 500,  maxEvents: null, branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    corporate_pro:      { maxParticipants: 2000, maxEvents: null, branding: false, customDomain: false, whiteLabel: false, platformBranding: true  },
    corporate_wl:       { maxParticipants: 500,  maxEvents: null, branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
    corporate_pro_wl:   { maxParticipants: 2000, maxEvents: null, branding: true,  customDomain: true,  whiteLabel: true,  platformBranding: false },
};

const DEFAULT_FEATURES: PlanFeatures = { maxParticipants: 50, maxEvents: null, branding: false, customDomain: false, whiteLabel: false, platformBranding: true };

export function getPlanFeatures(plan: string): PlanFeatures {
    return PLAN_FEATURES[plan.toLowerCase()] ?? DEFAULT_FEATURES;
}

export type OrganizationAccess = {
    plan: string;
    hasActiveSubscription: boolean;
    trialEndsAt: Date;
    isTrialActive: boolean;
    isExpired: boolean;
    isFreeOrTrial: boolean;
    currentPeriodEnd: Date | null;
    features: PlanFeatures;
};

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseWindowDate(input: string, fallback: Date): Date {
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function isSpringPilotPlan(plan: string | null | undefined): boolean {
    return String(plan || "").trim().toLowerCase() === SPRING_PILOT_PLAN;
}

function getSpringPilotWindow(now: Date): { startsAt: Date; endsAt: Date } {
    const year = now.getUTCFullYear();
    const defaultStart = new Date(`${year}-04-01T00:00:00+03:00`);
    const defaultEnd = new Date(`${year}-04-30T23:59:59+03:00`);

    return {
        startsAt: parseWindowDate(SPRING_PILOT_START, defaultStart),
        endsAt: parseWindowDate(SPRING_PILOT_END, defaultEnd),
    };
}

function getPlanPriority(plan: string): number {
    const features = getPlanFeatures(plan);
    const maxEventsScore = features.maxEvents === null ? 10000 : features.maxEvents;

    return (
        (features.whiteLabel ? 1_000_000_000 : 0) +
        (features.branding ? 100_000_000 : 0) +
        (features.customDomain ? 10_000_000 : 0) +
        maxEventsScore * 10_000 +
        features.maxParticipants
    );
}

type AccessSubscriptionRecord = {
    id: string;
    plan: string | null;
    current_period_end: Date | string | null;
    created_at: Date;
};

function compareActiveSubscriptions(a: AccessSubscriptionRecord, b: AccessSubscriptionRecord): number {
    const planPriorityDiff = getPlanPriority(b.plan || "free") - getPlanPriority(a.plan || "free");
    if (planPriorityDiff !== 0) return planPriorityDiff;

    const aPeriodEnd = a.current_period_end ? new Date(a.current_period_end as any).getTime() : Number.POSITIVE_INFINITY;
    const bPeriodEnd = b.current_period_end ? new Date(b.current_period_end as any).getTime() : Number.POSITIVE_INFINITY;
    if (bPeriodEnd !== aPeriodEnd) return bPeriodEnd - aPeriodEnd;

    return b.created_at.getTime() - a.created_at.getTime();
}

export async function getOrganizationAccess(prisma: PrismaClient, organizationId: string): Promise<OrganizationAccess> {
    const org = await prisma.organizations.findUnique({
        where: { id: organizationId } as any,
        select: {
            id: true,
            plan: true,
            created_at: true,
        },
    });

    if (!org) {
        // If org is missing, fail closed for safety.
        const now = new Date();
        return {
            plan: "unknown",
            hasActiveSubscription: false,
            trialEndsAt: now,
            isTrialActive: false,
            isExpired: true,
            isFreeOrTrial: true,
            currentPeriodEnd: null,
            features: DEFAULT_FEATURES,
        };
    }

    const now = new Date();
    const defaultTrialEndsAt = new Date(org.created_at.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const subscriptions = await prisma.subscriptions.findMany({
        where: {
            organization_id: organizationId,
            status: "active",
        } as any,
        orderBy: { created_at: "desc" } as any,
        select: {
            id: true,
            plan: true,
            current_period_end: true,
            created_at: true,
        },
    });

    let hasActiveSubscription = false;
    let effectivePlan = "free";
    let currentPeriodEnd: Date | null = null;

    const activeSubscriptions = subscriptions
        .filter((sub) => {
            if (!sub.current_period_end) return true;

            const periodEnd = new Date(sub.current_period_end as any);
            return periodEnd >= startOfDay(now);
        })
        .sort(compareActiveSubscriptions);

    const selectedSubscription = activeSubscriptions[0] ?? null;

    if (selectedSubscription) {
        hasActiveSubscription = true;
        currentPeriodEnd = selectedSubscription.current_period_end
            ? new Date(selectedSubscription.current_period_end as any)
            : null;
        effectivePlan = selectedSubscription.plan || org.plan || "free";
    }

    const springPilotWindow = getSpringPilotWindow(now);
    const springPilotActive = isSpringPilotPlan(org.plan)
        && !selectedSubscription
        && now <= springPilotWindow.endsAt
        && (SPRING_PILOT_ALLOW_EARLY_ACCESS || now >= springPilotWindow.startsAt);
    const springPilotExpired = isSpringPilotPlan(org.plan) && now > springPilotWindow.endsAt;

    if (springPilotActive) {
        effectivePlan = SPRING_PILOT_PLAN;
        currentPeriodEnd = springPilotWindow.endsAt;
    }

    // Keep organization.plan in sync with the effective access plan.
    if (!isSpringPilotPlan(org.plan) && (org.plan ?? "").toLowerCase() !== effectivePlan.toLowerCase()) {
        await prisma.organizations.update({
            where: { id: org.id } as any,
            data: {
                plan: effectivePlan,
                updated_at: now,
            } as any,
        });
    }

    const trialEndsAt = springPilotActive || springPilotExpired ? springPilotWindow.endsAt : defaultTrialEndsAt;
    const isTrialActive = springPilotActive ? true : now < trialEndsAt;
    const isFreeOrTrial = effectivePlan.toLowerCase() === "free" && !hasActiveSubscription && !springPilotActive;
    const isExpired = springPilotExpired || (isFreeOrTrial && !isTrialActive);

    const features = getPlanFeatures(effectivePlan);

    return {
        plan: effectivePlan,
        hasActiveSubscription,
        trialEndsAt,
        isTrialActive,
        isExpired,
        isFreeOrTrial,
        currentPeriodEnd,
        features,
    };
}
