import { z } from "zod";
import { router, protectedProcedure, superAdminProcedure } from "../trpc";
import { redis } from "../config/redis";
import { getOrganizationAccess } from "../utils/access";

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:4001';
const VISITOR_PREFIX = 'visitor:';

const pctChange = (current: number, previous: number): number => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};

const round1 = (value: number): number => {
    return Math.round(value * 10) / 10;
};

const billingOpsInputSchema = z.object({
    search: z.string().trim().max(160).optional(),
    plan: z.string().trim().max(80).optional(),
    subscriptionStatus: z.string().trim().max(80).optional(),
    gatewayStatus: z.string().trim().max(80).optional(),
    activationStatus: z.string().trim().max(80).optional(),
    expiredOnly: z.boolean().optional(),
    addonOnly: z.boolean().optional(),
});

type JsonRecord = Record<string, unknown>;

function readJsonRecord(value: unknown): JsonRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as JsonRecord;
}

function readJsonArray(value: unknown): JsonRecord[] {
    return Array.isArray(value)
        ? value.filter((item): item is JsonRecord => Boolean(readJsonRecord(item)))
        : [];
}

function readString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readAmount(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toIso(value: Date | null | undefined): string | null {
    return value instanceof Date ? value.toISOString() : null;
}

function isDateExpired(value: Date | null | undefined, now: Date): boolean {
    return value instanceof Date && value.getTime() < now.getTime();
}

function normalizeSubscriptionStatus(status: string | null | undefined, currentPeriodEnd: Date | null, now: Date): string {
    const normalized = (status ?? "none").toLowerCase();
    if (normalized === "active" && isDateExpired(currentPeriodEnd, now)) {
        return "expired";
    }
    return normalized;
}

function deriveEffectiveReason(params: {
    rawPlan: string;
    effectivePlan: string;
    hasActiveSubscription: boolean;
    isTrialActive: boolean;
    currentPeriodEnd: Date | null;
}): string {
    if (params.hasActiveSubscription) return "active subscription";
    if (params.isTrialActive) return "trial";
    if (params.currentPeriodEnd) return "expired subscription";
    if (params.rawPlan.toLowerCase() !== params.effectivePlan.toLowerCase()) return "raw plan out of sync";
    return "no active subscription";
}

function normalizeStatusFilter(value: string | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && normalized !== "all" ? normalized : null;
}

export const dashboardRouter = router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const orgId = ctx.user.organizationId;

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalParticipants,
            participantsThisMonth,
            participantsPrevMonth,
            activeEvents,
            eventsThisMonth,
            eventsPrevMonth,
            engagedParticipantsThisMonth,
            engagedParticipantsPrevMonth,
        ] = await Promise.all([
            ctx.prisma.participants.count({
                where: { events: { organization_id: orgId } },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: thisMonthStart, lt: nextMonthStart },
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: prevMonthStart, lt: thisMonthStart },
                },
            }),
            ctx.prisma.events.count({
                where: { organization_id: orgId, status: "active" },
            }),
            ctx.prisma.events.count({
                where: {
                    organization_id: orgId,
                    created_at: { gte: thisMonthStart, lt: nextMonthStart },
                },
            }),
            ctx.prisma.events.count({
                where: {
                    organization_id: orgId,
                    created_at: { gte: prevMonthStart, lt: thisMonthStart },
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: thisMonthStart, lt: nextMonthStart },
                    OR: [{ responses: { some: {} } }, { qanda_submissions: { some: {} } }],
                },
            }),
            ctx.prisma.participants.count({
                where: {
                    events: { organization_id: orgId },
                    joined_at: { gte: prevMonthStart, lt: thisMonthStart },
                    OR: [{ responses: { some: {} } }, { qanda_submissions: { some: {} } }],
                },
            }),
        ]);

        const participantsChangePct = round1(pctChange(participantsThisMonth, participantsPrevMonth));
        const meetingsChangePct = round1(pctChange(eventsThisMonth, eventsPrevMonth));

        const engagementRateThisMonth = participantsThisMonth
            ? round1((engagedParticipantsThisMonth / participantsThisMonth) * 100)
            : 0;
        const engagementRatePrevMonth = participantsPrevMonth
            ? round1((engagedParticipantsPrevMonth / participantsPrevMonth) * 100)
            : 0;
        const engagementRateDelta = round1(engagementRateThisMonth - engagementRatePrevMonth);

        return {
            totalParticipants,
            participantsChangePct,
            activeEvents,
            meetingsThisMonth: eventsThisMonth,
            meetingsChangePct,
            engagementRate: engagementRateThisMonth,
            engagementRateDelta,
        };
    }),

    /* ── Superadmin: Active Users / Live Connections ── */
    getActiveUsers: superAdminProcedure.query(async ({ ctx }) => {
        // 1. Fetch real-time stats from WebSocket server
        let wsStats = {
            totalConnections: 0,
            rooms: [] as Array<{ room: string; count: number }>,
            connections: [] as Array<{
                id: string;
                connectedAt: string;
                address: string;
                rooms: string[];
                userAgent: string;
                eventId: string | null;
            }>,
            uptime: 0,
            timestamp: new Date().toISOString(),
        };

        try {
            const response = await fetch(`${WS_SERVER_URL}/internal/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                wsStats = await response.json();
            }
        } catch (err) {
            console.warn("Could not fetch WS stats:", err);
        }

        // 2. Enrich rooms with event names from DB
        const eventIds = wsStats.rooms
            .map((r) => r.room.replace("event-", ""))
            .filter(Boolean);

        let eventMap: Record<string, string> = {};
        if (eventIds.length > 0) {
            const events = await ctx.prisma.events.findMany({
                where: { id: { in: eventIds } },
                select: { id: true, name: true },
            });
            eventMap = Object.fromEntries(events.map((e: { id: string; name: string }) => [e.id, e.name]));
        }

        const enrichedRooms = wsStats.rooms.map((r) => {
            const eventId = r.room.replace("event-", "");
            return {
                ...r,
                eventId,
                eventTitle: eventMap[eventId] || "Bilinmeyen Etkinlik",
            };
        });

        // 3. Get global platform stats
        const [totalUsers, totalOrgs, totalEvents, activeEventsCount] = await Promise.all([
            ctx.prisma.users.count(),
            ctx.prisma.organizations.count(),
            ctx.prisma.events.count(),
            ctx.prisma.events.count({ where: { status: "active" } }),
        ]);

        // 4. Get active sessions (logged-in users)
        const now = new Date();
        const activeSessions = await ctx.prisma.sessions.findMany({
            where: {
                expires_at: { gt: now },
            },
            select: {
                id: true,
                expires_at: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatar_url: true,
                        organization_id: true,
                        organizations: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { expires_at: "desc" },
        });

        // Deduplicate by user id (a user may have multiple sessions)
        const seenUsers = new Set<string>();
        const onlineUsers = activeSessions
            .filter((s) => {
                if (seenUsers.has(s.users.id)) return false;
                seenUsers.add(s.users.id);
                return true;
            })
            .map((s) => ({
                userId: s.users.id,
                name: s.users.name || "İsimsiz",
                email: s.users.email,
                role: s.users.role,
                avatarUrl: s.users.avatar_url,
                organizationName: s.users.organizations?.name || null,
                sessionExpiresAt: s.expires_at.toISOString(),
            }));

        // 5. Get active visitors from Redis
        const visitorKeys = await redis.keys(`${VISITOR_PREFIX}*`);
        const visitors: Array<{
            visitorId: string;
            page: string;
            ua: string;
            ip: string;
            ts: number;
            firstSeen: number;
            referrer?: string;
        }> = [];

        if (visitorKeys.length > 0) {
            const pipeline = redis.pipeline();
            for (const k of visitorKeys) {
                pipeline.get(k);
            }
            const results = await pipeline.exec();
            if (results) {
                for (let i = 0; i < visitorKeys.length; i++) {
                    const [err, val] = results[i] || [];
                    if (!err && val) {
                        try {
                            const data = JSON.parse(val as string);
                            visitors.push({
                                visitorId: visitorKeys[i].replace(VISITOR_PREFIX, ''),
                                ...data,
                            });
                        } catch { /* skip */ }
                    }
                }
            }
        }
        visitors.sort((a, b) => b.ts - a.ts);

        return {
            live: {
                totalConnections: wsStats.totalConnections,
                rooms: enrichedRooms,
                connections: wsStats.connections,
                wsUptime: wsStats.uptime,
            },
            platform: {
                totalUsers,
                totalOrgs,
                totalEvents,
                activeEvents: activeEventsCount,
            },
            onlineUsers,
            visitors: {
                total: visitors.length,
                list: visitors,
            },
            timestamp: wsStats.timestamp,
        };
    }),

    getBillingOps: superAdminProcedure
        .input(billingOpsInputSchema.optional())
        .query(async ({ ctx, input }) => {
            const now = new Date();
            const pendingThreshold = new Date(now.getTime() - 30 * 60 * 1000);

            const organizations = await ctx.prisma.organizations.findMany({
                orderBy: { updated_at: "desc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    plan: true,
                    created_at: true,
                    updated_at: true,
                    users: {
                        orderBy: [{ created_at: "asc" }],
                        take: 1,
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            phone: true,
                            email_verified: true,
                            phone_verified: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                    subscriptions: {
                        orderBy: [{ created_at: "desc" }],
                        take: 8,
                        select: {
                            id: true,
                            plan: true,
                            status: true,
                            payment_method: true,
                            current_period_start: true,
                            current_period_end: true,
                            created_at: true,
                            updated_at: true,
                            metadata: true,
                        },
                    },
                },
            });

            const accessList = await Promise.all(
                organizations.map(async (organization) => ({
                    organizationId: organization.id,
                    access: await getOrganizationAccess(ctx.prisma as any, organization.id),
                }))
            );

            const accessMap = new Map(accessList.map((item) => [item.organizationId, item.access]));

            const allRecords = organizations.map((organization) => {
                const owner = organization.users[0] ?? null;
                const latestSubscription = organization.subscriptions[0] ?? null;
                const failedPaymentsCount = organization.subscriptions.filter((subscription) => {
                    const subscriptionMetadata = readJsonRecord(subscription.metadata) ?? {};
                    const subscriptionGateway = readJsonRecord(subscriptionMetadata.gateway);
                    const normalizedStatus = normalizeSubscriptionStatus(
                        subscription.status,
                        subscription.current_period_end,
                        now
                    );
                    const normalizedGatewayStatus = (
                        readString(subscriptionGateway?.status)
                        ?? readString(subscriptionMetadata.paytr_status)
                        ?? "none"
                    ).toLowerCase();

                    return normalizedStatus === "failed" || normalizedGatewayStatus === "failed";
                }).length;
                const metadata = readJsonRecord(latestSubscription?.metadata) ?? {};
                const gateway = readJsonRecord(metadata.gateway);
                const activation = readJsonRecord(metadata.activation);
                const entitlements = readJsonArray(metadata.entitlements);
                const addons = readJsonArray(metadata.addons);
                const access = accessMap.get(organization.id)!;

                const currentPeriodStart = latestSubscription?.current_period_start ?? null;
                const currentPeriodEnd = latestSubscription?.current_period_end ?? null;
                const subscriptionStatus = normalizeSubscriptionStatus(latestSubscription?.status, currentPeriodEnd, now);
                const gatewayStatus = readString(gateway?.status) ?? readString(metadata.paytr_status) ?? "none";
                const activationStatus = readString(activation?.status) ?? (latestSubscription ? "missing" : "none");
                const merchantOid = readString(metadata.merchant_oid) ?? readString(gateway?.merchant_oid);
                const packageId = readString(metadata.packageId);
                const packageName = readString(metadata.packageName);
                const amount = readAmount(metadata.paytr_total_amount ?? metadata.amount);
                const currency = readString(metadata.currency) ?? "TRY";
                const updatedAt = latestSubscription?.updated_at ?? organization.updated_at;
                const effectiveReason = deriveEffectiveReason({
                    rawPlan: organization.plan,
                    effectivePlan: access.plan,
                    hasActiveSubscription: access.hasActiveSubscription,
                    isTrialActive: access.isTrialActive,
                    currentPeriodEnd,
                });

                const problemReasons: string[] = [];
                if (latestSubscription?.status === "active" && isDateExpired(currentPeriodEnd, now)) {
                    problemReasons.push("subscription active ama current_period_end geçmiş");
                }
                if ((organization.plan ?? "free").toLowerCase() !== "free" && access.plan.toLowerCase() === "free") {
                    problemReasons.push("raw plan premium ama effective access free");
                }
                if (gatewayStatus === "success" && !activation) {
                    problemReasons.push("gateway success ama activation missing");
                }
                if (activationStatus === "active" && entitlements.length === 0) {
                    problemReasons.push("activation active ama entitlements boş");
                }
                if (latestSubscription?.status === "pending" && latestSubscription.created_at < pendingThreshold) {
                    problemReasons.push("pending subscription uzun süredir bekliyor");
                }
                if (latestSubscription?.status === "failed") {
                    problemReasons.push("failed payment kaydı");
                }
                if (failedPaymentsCount > 1) {
                    problemReasons.push("aynı organizasyonda tekrar eden failed payment kayıtları");
                }

                return {
                    organizationId: organization.id,
                    organizationName: organization.name,
                    organizationSlug: organization.slug,
                    rawOrganizationPlan: organization.plan,
                    ownerEmail: owner?.email ?? null,
                    owner: owner
                        ? {
                              id: owner.id,
                              email: owner.email,
                              name: owner.name,
                              role: owner.role,
                              phone: owner.phone,
                              emailVerified: owner.email_verified,
                              phoneVerified: owner.phone_verified,
                              createdAt: toIso(owner.created_at),
                              updatedAt: toIso(owner.updated_at),
                          }
                        : null,
                    effectiveAccess: {
                        plan: access.plan,
                        hasActiveSubscription: access.hasActiveSubscription,
                        trialEndsAt: toIso(access.trialEndsAt),
                        isTrialActive: access.isTrialActive,
                        isExpired: access.isExpired,
                        isFreeOrTrial: access.isFreeOrTrial,
                        currentPeriodEnd: toIso(access.currentPeriodEnd),
                        features: access.features,
                        reason: effectiveReason,
                    },
                    subscription: latestSubscription
                        ? {
                              id: latestSubscription.id,
                              plan: latestSubscription.plan,
                              status: subscriptionStatus,
                              rawStatus: latestSubscription.status ?? "none",
                              paymentMethod: latestSubscription.payment_method,
                              packageId,
                              packageName,
                              amount,
                              currency,
                              currentPeriodStart: toIso(currentPeriodStart),
                              currentPeriodEnd: toIso(currentPeriodEnd),
                              merchantOid,
                              gatewayStatus,
                              activationStatus,
                              createdAt: toIso(latestSubscription.created_at),
                              updatedAt: toIso(latestSubscription.updated_at),
                          }
                        : null,
                    subscriptionStatus,
                    gatewayStatus,
                    activationStatus,
                    currentPeriodEnd: toIso(currentPeriodEnd),
                    addons: addons.map((addon) => ({
                        id: readString(addon.id),
                        name: readString(addon.name),
                        scope: readString(addon.scope),
                        eventId: readString(addon.eventId),
                        eventUsageLimit: readAmount(addon.eventUsageLimit),
                        amount: readAmount(addon.amount),
                    })),
                    entitlements,
                    metadata: {
                        gateway,
                        activation,
                    },
                    merchantOid,
                    updatedAt: toIso(updatedAt),
                    createdAt: toIso(organization.created_at),
                    hasProblem: problemReasons.length > 0,
                    problemReasons,
                };
            });

            const summary = {
                activeSubscriptionsCount: allRecords.filter((record) => record.subscription?.status === "active").length,
                pendingPaymentsCount: allRecords.filter((record) => record.subscription?.status === "pending").length,
                failedPaymentsCount: allRecords.filter((record) => record.subscription?.status === "failed").length,
                expiredSubscriptionsCount: allRecords.filter((record) => record.subscription?.status === "expired").length,
                activeAddonSubscriptionsCount: allRecords.filter(
                    (record) => record.addons.length > 0 && record.effectiveAccess.hasActiveSubscription
                ).length,
                trialOrganizationsCount: allRecords.filter(
                    (record) => record.effectiveAccess.isTrialActive && !record.effectiveAccess.hasActiveSubscription
                ).length,
            };

            const search = input?.search?.trim().toLowerCase() ?? "";
            const planFilter = normalizeStatusFilter(input?.plan);
            const subscriptionFilter = normalizeStatusFilter(input?.subscriptionStatus);
            const gatewayFilter = normalizeStatusFilter(input?.gatewayStatus);
            const activationFilter = normalizeStatusFilter(input?.activationStatus);

            const records = allRecords.filter((record) => {
                if (search) {
                    const haystack = [
                        record.organizationName,
                        record.owner?.email,
                        record.owner?.name,
                        record.merchantOid,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();
                    if (!haystack.includes(search)) return false;
                }
                if (planFilter) {
                    const raw = record.rawOrganizationPlan.toLowerCase();
                    const effective = record.effectiveAccess.plan.toLowerCase();
                    if (raw !== planFilter && effective !== planFilter) return false;
                }
                if (subscriptionFilter && (record.subscription?.status ?? "none") !== subscriptionFilter) return false;
                if (gatewayFilter && (record.subscription?.gatewayStatus ?? "none") !== gatewayFilter) return false;
                if (activationFilter && (record.subscription?.activationStatus ?? "none") !== activationFilter) return false;
                if (input?.expiredOnly && record.subscription?.status !== "expired") return false;
                if (input?.addonOnly && record.addons.length === 0) return false;
                return true;
            });

            records.sort((a, b) => {
                const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return bTime - aTime;
            });

            const problemRecords = allRecords
                .filter((record) => record.hasProblem)
                .sort((a, b) => {
                    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    return bTime - aTime;
                })
                .slice(0, 12)
                .map((record) => ({
                    organizationId: record.organizationId,
                    organizationName: record.organizationName,
                    merchantOid: record.merchantOid,
                    subscriptionStatus: record.subscription?.status ?? "none",
                    gatewayStatus: record.subscription?.gatewayStatus ?? "none",
                    activationStatus: record.subscription?.activationStatus ?? "none",
                    updatedAt: record.updatedAt,
                    problemReasons: record.problemReasons,
                }));

            return {
                summary,
                records,
                problemRecords,
            };
        }),
});
