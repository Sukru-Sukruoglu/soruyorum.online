import { z } from "zod";
import { router, protectedProcedure, superAdminProcedure } from "../trpc";
import { redis } from "../config/redis";
import { normalizeIp, resolveGeoForIp } from "../utils/geo";
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

function maxIsoDate(...values: Array<Date | null | undefined>): string | null {
    const filtered = values.filter((value): value is Date => value instanceof Date);
    if (filtered.length === 0) return null;
    return filtered.reduce((latest, current) => current.getTime() > latest.getTime() ? current : latest).toISOString();
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
            geo?: Awaited<ReturnType<typeof resolveGeoForIp>>;
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

        const onlineUserIds = onlineUsers.map((user) => user.userId);
        const [userAuditLogs, recentAuditLogs] = await Promise.all([
            onlineUserIds.length > 0
                ? ctx.prisma.audit_logs.findMany({
                      where: { user_id: { in: onlineUserIds } },
                      orderBy: { created_at: "desc" },
                      take: 250,
                      select: {
                          id: true,
                          user_id: true,
                          action: true,
                          resource: true,
                          resource_id: true,
                          details: true,
                          ip_address: true,
                          user_agent: true,
                          created_at: true,
                          users: {
                              select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                  role: true,
                              },
                          },
                          organizations: {
                              select: {
                                  id: true,
                                  name: true,
                              },
                          },
                      },
                  })
                : Promise.resolve([]),
            ctx.prisma.audit_logs.findMany({
                orderBy: { created_at: "desc" },
                take: 80,
                select: {
                    id: true,
                    user_id: true,
                    action: true,
                    resource: true,
                    resource_id: true,
                    details: true,
                    ip_address: true,
                    user_agent: true,
                    created_at: true,
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    organizations: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const uniqueIps = Array.from(new Set([
            ...visitors.map((visitor) => normalizeIp(visitor.ip)).filter((value): value is string => Boolean(value)),
            ...wsStats.connections.map((connection) => normalizeIp(connection.address)).filter((value): value is string => Boolean(value)),
            ...recentAuditLogs.map((log) => normalizeIp(log.ip_address)).filter((value): value is string => Boolean(value)),
            ...userAuditLogs.map((log) => normalizeIp(log.ip_address)).filter((value): value is string => Boolean(value)),
        ]));

        const geoEntries = await Promise.all(
            uniqueIps.map(async (ip) => [ip, await resolveGeoForIp(ip)] as const)
        );
        const geoMap = Object.fromEntries(geoEntries);

        const onlineUserAuditMap = new Map<string, typeof userAuditLogs>();
        for (const log of userAuditLogs) {
            if (!log.user_id) continue;
            const existing = onlineUserAuditMap.get(log.user_id) ?? [];
            existing.push(log);
            onlineUserAuditMap.set(log.user_id, existing);
        }

        const enrichedOnlineUsers = onlineUsers.map((user) => {
            const logs = onlineUserAuditMap.get(user.userId) ?? [];
            const latestLog = logs[0] ?? null;
            const recentIps = Array.from(new Set(
                logs
                    .map((log) => normalizeIp(log.ip_address))
                    .filter((value): value is string => Boolean(value))
            )).slice(0, 4);

            return {
                ...user,
                lastAction: latestLog
                    ? {
                          action: latestLog.action,
                          resource: latestLog.resource,
                          resourceId: latestLog.resource_id,
                          createdAt: latestLog.created_at.toISOString(),
                          ipAddress: normalizeIp(latestLog.ip_address),
                          userAgent: latestLog.user_agent,
                          geo: latestLog.ip_address ? geoMap[normalizeIp(latestLog.ip_address) ?? ""] ?? null : null,
                      }
                    : null,
                recentIps: recentIps.map((ip) => ({
                    ip,
                    geo: geoMap[ip] ?? null,
                })),
                lastSeenAt: maxIsoDate(
                    latestLog?.created_at ?? null,
                    new Date(user.sessionExpiresAt)
                ),
            };
        });

        const enrichedVisitors = visitors.map((visitor) => {
            const normalizedVisitorIp = normalizeIp(visitor.ip) ?? visitor.ip;
            return {
                ...visitor,
                ip: normalizedVisitorIp,
                geo: visitor.geo ?? geoMap[normalizedVisitorIp] ?? null,
            };
        });

        const enrichedConnections = wsStats.connections.map((connection) => {
            const normalizedConnectionIp = normalizeIp(connection.address) ?? connection.address;
            return {
                ...connection,
                address: normalizedConnectionIp,
                geo: geoMap[normalizedConnectionIp] ?? null,
            };
        });

        const recentActivity = recentAuditLogs.map((log) => {
            const normalizedLogIp = normalizeIp(log.ip_address);
            return {
                id: log.id,
                action: log.action,
                resource: log.resource,
                resourceId: log.resource_id,
                details: readJsonRecord(log.details),
                createdAt: log.created_at.toISOString(),
                ipAddress: normalizedLogIp,
                userAgent: log.user_agent,
                geo: normalizedLogIp ? geoMap[normalizedLogIp] ?? null : null,
                user: log.users
                    ? {
                          id: log.users.id,
                          name: log.users.name || "İsimsiz",
                          email: log.users.email,
                          role: log.users.role,
                      }
                    : null,
                organization: log.organizations
                    ? {
                          id: log.organizations.id,
                          name: log.organizations.name,
                      }
                    : null,
            };
        });

        const ipActivityMap = new Map<string, {
            ip: string;
            geo: Awaited<ReturnType<typeof resolveGeoForIp>>;
            liveConnections: number;
            activeVisitors: number;
            recentActions: number;
            users: Set<string>;
            pages: Set<string>;
            lastSeenAt: string | null;
        }>();

        const touchIp = (ip: string | null | undefined, patch?: {
            geo?: Awaited<ReturnType<typeof resolveGeoForIp>>;
            userEmail?: string | null;
            page?: string | null;
            liveConnections?: number;
            activeVisitors?: number;
            recentActions?: number;
            seenAt?: string | null;
        }) => {
            const normalized = normalizeIp(ip);
            if (!normalized) return;

            const current = ipActivityMap.get(normalized) ?? {
                ip: normalized,
                geo: geoMap[normalized] ?? null,
                liveConnections: 0,
                activeVisitors: 0,
                recentActions: 0,
                users: new Set<string>(),
                pages: new Set<string>(),
                lastSeenAt: null,
            };

            if (patch?.geo !== undefined) current.geo = patch.geo;
            if (patch?.userEmail) current.users.add(patch.userEmail);
            if (patch?.page) current.pages.add(patch.page);
            if (patch?.liveConnections) current.liveConnections += patch.liveConnections;
            if (patch?.activeVisitors) current.activeVisitors += patch.activeVisitors;
            if (patch?.recentActions) current.recentActions += patch.recentActions;
            if (patch?.seenAt && (!current.lastSeenAt || patch.seenAt > current.lastSeenAt)) {
                current.lastSeenAt = patch.seenAt;
            }

            ipActivityMap.set(normalized, current);
        };

        for (const visitor of enrichedVisitors) {
            touchIp(visitor.ip, {
                geo: visitor.geo ?? null,
                page: visitor.page,
                activeVisitors: 1,
                seenAt: new Date(visitor.ts).toISOString(),
            });
        }

        for (const connection of enrichedConnections) {
            touchIp(connection.address, {
                geo: connection.geo ?? null,
                liveConnections: 1,
                seenAt: connection.connectedAt,
            });
        }

        for (const item of recentActivity) {
            touchIp(item.ipAddress, {
                geo: item.geo ?? null,
                userEmail: item.user?.email ?? null,
                recentActions: 1,
                seenAt: item.createdAt,
            });
        }

        const ipActivity = Array.from(ipActivityMap.values())
            .map((entry) => ({
                ip: entry.ip,
                geo: entry.geo,
                liveConnections: entry.liveConnections,
                activeVisitors: entry.activeVisitors,
                recentActions: entry.recentActions,
                users: Array.from(entry.users),
                pages: Array.from(entry.pages).slice(0, 5),
                lastSeenAt: entry.lastSeenAt,
            }))
            .sort((left, right) => {
                const leftScore = left.liveConnections + left.activeVisitors + left.recentActions;
                const rightScore = right.liveConnections + right.activeVisitors + right.recentActions;
                if (rightScore !== leftScore) return rightScore - leftScore;
                return (right.lastSeenAt ?? "").localeCompare(left.lastSeenAt ?? "");
            })
            .slice(0, 50);

        return {
            live: {
                totalConnections: wsStats.totalConnections,
                rooms: enrichedRooms,
                connections: enrichedConnections,
                wsUptime: wsStats.uptime,
            },
            platform: {
                totalUsers,
                totalOrgs,
                totalEvents,
                activeEvents: activeEventsCount,
            },
            onlineUsers: enrichedOnlineUsers,
            visitors: {
                total: enrichedVisitors.length,
                list: enrichedVisitors,
            },
            recentActivity,
            ipActivity,
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
