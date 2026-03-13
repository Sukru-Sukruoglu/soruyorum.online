import type { PrismaClient } from "@ks-interaktif/database";

const TRIAL_DAYS = Number.parseInt(process.env.TRIAL_DAYS ?? "14", 10);

const DEFAULT_SUPERADMIN_ROLES = ["superadmin", "super_admin", "root", "system", "owner", "admin", "ADMIN"];

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

/* ── Plan-Feature Mapping ── */
export type PlanFeatures = {
    maxParticipants: number;        // Aynı anda max kişi sayısı
    maxEvents: number | null;       // Toplam etkinlik hakkı (null = sınırsız)
    branding: boolean;              // Full branding dahil mi
    customDomain: boolean;          // Özel subdomain / domain
    whiteLabel: boolean;            // WL mi
};

const PLAN_FEATURES: Record<string, PlanFeatures> = {
    free:               { maxParticipants: 50,   maxEvents: null, branding: false, customDomain: false, whiteLabel: false },
    event_starter:      { maxParticipants: 100,  maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false },
    event_standard:     { maxParticipants: 500,  maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false },
    event_professional: { maxParticipants: 2000, maxEvents: 1,    branding: false, customDomain: false, whiteLabel: false },
    starter_wl:         { maxParticipants: 100,  maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true  },
    standard_wl:        { maxParticipants: 500,  maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true  },
    professional_wl:    { maxParticipants: 2000, maxEvents: 1,    branding: true,  customDomain: true,  whiteLabel: true  },
    corporate:          { maxParticipants: 500,  maxEvents: null, branding: false, customDomain: false, whiteLabel: false },
    corporate_pro:      { maxParticipants: 2000, maxEvents: null, branding: false, customDomain: false, whiteLabel: false },
    corporate_wl:       { maxParticipants: 500,  maxEvents: null, branding: true,  customDomain: true,  whiteLabel: true  },
    corporate_pro_wl:   { maxParticipants: 2000, maxEvents: null, branding: true,  customDomain: true,  whiteLabel: true  },
};

const DEFAULT_FEATURES: PlanFeatures = { maxParticipants: 50, maxEvents: null, branding: false, customDomain: false, whiteLabel: false };

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

export async function getOrganizationAccess(prisma: PrismaClient, organizationId: string): Promise<OrganizationAccess> {
    const org = await prisma.organizations.findUnique({
        where: { id: organizationId } as any,
        select: {
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
    const trialEndsAt = new Date(org.created_at.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const sub = await prisma.subscriptions.findFirst({
        where: {
            organization_id: organizationId,
            status: "active",
        } as any,
        orderBy: { created_at: "desc" } as any,
        select: {
            plan: true,
            current_period_end: true,
            status: true,
        },
    });

    let hasActiveSubscription = false;
    let effectivePlan = "free";
    let currentPeriodEnd: Date | null = null;

    if (sub) {
        if (!sub.current_period_end) {
            hasActiveSubscription = true;
        } else {
            const periodEnd = new Date(sub.current_period_end as any);
            currentPeriodEnd = periodEnd;
            hasActiveSubscription = periodEnd >= startOfDay(now);
        }

        if (hasActiveSubscription) {
            effectivePlan = sub.plan || org.plan || "free";
        }
    }

    // Keep organization.plan in sync once the paid period is over.
    if (!hasActiveSubscription && (org.plan ?? "").toLowerCase() !== "free") {
        await prisma.organizations.update({
            where: { id: organizationId } as any,
            data: {
                plan: "free",
                updated_at: now,
            } as any,
        });
    }

    const isTrialActive = now < trialEndsAt;
    const isFreeOrTrial = effectivePlan.toLowerCase() === "free" && !hasActiveSubscription;
    const isExpired = isFreeOrTrial && !isTrialActive;

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
