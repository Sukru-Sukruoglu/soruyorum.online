import type { PrismaClient } from "@ks-interaktif/database";

const TRIAL_DAYS = Number.parseInt(process.env.TRIAL_DAYS ?? "14", 10);

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

export type OrganizationAccess = {
    plan: string;
    hasActiveSubscription: boolean;
    trialEndsAt: Date;
    isTrialActive: boolean;
    isExpired: boolean;
    isFreeOrTrial: boolean;
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
        };
    }

    const now = new Date();
    const trialEndsAt = new Date(org.created_at.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    let hasActiveSubscription = false;

    if ((org.plan ?? "").toLowerCase() !== "free") {
        hasActiveSubscription = true;
    } else {
        const sub = await prisma.subscriptions.findFirst({
            where: {
                organization_id: organizationId,
                status: "active",
            } as any,
            orderBy: { created_at: "desc" } as any,
            select: {
                current_period_end: true,
                status: true,
            },
        });

        if (sub) {
            if (!sub.current_period_end) {
                hasActiveSubscription = true;
            } else {
                const periodEnd = new Date(sub.current_period_end as any);
                hasActiveSubscription = periodEnd >= startOfDay(now);
            }
        }
    }

    const isTrialActive = now < trialEndsAt;
    const isFreeOrTrial = (org.plan ?? "").toLowerCase() === "free" && !hasActiveSubscription;
    const isExpired = isFreeOrTrial && !isTrialActive;

    return {
        plan: org.plan,
        hasActiveSubscription,
        trialEndsAt,
        isTrialActive,
        isExpired,
        isFreeOrTrial,
    };
}
