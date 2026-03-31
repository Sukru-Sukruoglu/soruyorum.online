import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";
import crypto from "crypto";
import { getOrganizationAccess, isSuperAdmin, hasFullAccess } from "../utils/access";
import { sanitizeThemeForLimitedAccess } from "../utils/themeAccess";
import { getOrganizationJoinBaseUrl } from "../utils/domains";

const stripTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

const normalizeJoinUrl = (joinUrl: string, baseUrl: string) => {
    // Prevent accidentally emitting localhost links into QR codes in production.
    const base = stripTrailingSlashes(baseUrl);
    const replacedLocalhost = joinUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, base);

    // Keep canonical join URLs on the active host for the organization.
    try {
        const u = new URL(replacedLocalhost);
        const b = new URL(base);
        if (u.hostname !== b.hostname) {
            u.protocol = b.protocol;
            u.host = b.host;
            return u.toString();
        }
    } catch {
        // ignore
    }

    return replacedLocalhost;
};

const shouldRegenerateQr = (qrCodeUrl: string | null | undefined) => {
    if (!qrCodeUrl) return true;
    if (qrCodeUrl.startsWith("data:image/")) return false;
    // Historical external dependency; regenerate so QR always works.
    if (qrCodeUrl.includes("api.qrserver.com")) return true;
    return true;
};

const generateQrDataUrl = async (joinUrl: string) => {
    return QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
    });
};

const generateUniqueEventPin = async (prisma: any): Promise<string> => {
    // 6-digit numeric PIN; retry until unique (events.event_pin has a unique index)
    for (let attempt = 0; attempt < 25; attempt++) {
        const candidate = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await prisma.events.findFirst({ where: { event_pin: candidate } });
        if (!existing) return candidate;
    }
    // Fallback: very unlikely to hit
    return crypto.randomUUID().replace(/-/g, '').slice(0, 6);
};

export const eventsRouter = router({
    // Public endpoint to get event info (PIN, QR) for live display
    getPublicInfo: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const event = await ctx.prisma.events.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    organization_id: true,
                    name: true,
                    pin: true,
                    event_pin: true,
                    join_url: true,
                    qr_code_url: true,
                    status: true,
                    settings: true,
                }
            });

            if (!event) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
            }

            const baseUrl = await getOrganizationJoinBaseUrl(
                ctx.prisma as any,
                event.organization_id || undefined,
                ctx.req as any
            );

            // Define "Active" as joined AND not left AND seen in the last 45 minutes
            const activeThreshold = new Date(Date.now() - 45 * 60 * 1000);
            const participantCount = await ctx.prisma.participants.count({
                where: {
                    event_id: event.id,
                    left_at: null,
                    last_seen_at: { gte: activeThreshold }
                }
            });

            let eventPin = event.event_pin || event.pin || "";
            if (!eventPin) {
                eventPin = await generateUniqueEventPin(ctx.prisma);
                try {
                    await ctx.prisma.events.update({
                        where: { id: event.id },
                        data: {
                            event_pin: eventPin,
                            pin: eventPin,
                            updated_at: new Date(),
                        },
                    });
                } catch {
                    // ignore
                }
            }
            const fallbackJoinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
            const joinUrl = normalizeJoinUrl(event.join_url || fallbackJoinUrl, baseUrl);
            const qrCodeUrl = shouldRegenerateQr(event.qr_code_url)
                ? await generateQrDataUrl(joinUrl)
                : event.qr_code_url!;
            const access = event.organization_id
                ? await getOrganizationAccess(ctx.prisma as any, event.organization_id)
                : null;
            const publicTheme = (event as any)?.settings?.theme ?? null;

            const featuredQuestionId = (event as any)?.settings?.qanda?.featuredQuestionId as string | undefined;
            let featuredQuestion: any = null;
            if (featuredQuestionId) {
                const q = await ctx.prisma.qanda_submissions.findFirst({
                    where: { id: featuredQuestionId, event_id: event.id },
                    select: { id: true, participant_name: true, question_text: true },
                });
                if (q) {
                    featuredQuestion = {
                        id: q.id,
                        participantName: q.participant_name,
                        questionText: q.question_text,
                    };
                } else {
                    // Best-effort cleanup if the referenced question no longer exists.
                    try {
                        const settings: any = (event as any).settings || {};
                        const qanda: any = settings.qanda || {};
                        await ctx.prisma.events.update({
                            where: { id: event.id },
                            data: {
                                settings: {
                                    ...settings,
                                    qanda: { ...qanda, featuredQuestionId: null, featuredQuestionSetAt: null },
                                },
                                updated_at: new Date(),
                            },
                        });
                    } catch {
                        // ignore
                    }
                }
            }

            // Best-effort backfill so future requests don't need regeneration.
            if (event.join_url !== joinUrl || event.qr_code_url !== qrCodeUrl) {
                try {
                    await ctx.prisma.events.update({
                        where: { id: event.id },
                        data: { join_url: joinUrl, qr_code_url: qrCodeUrl, updated_at: new Date() },
                    });
                } catch {
                    // ignore
                }
            }
            // Extract the canonical join host from the organization's primary domain.
            let joinHost: string;
            try {
                joinHost = new URL(baseUrl).host;
            } catch {
                joinHost = 'mobil.soruyorum.online';
            }

            const whiteLabelEnabled = Boolean(
                access?.features?.whiteLabel &&
                access?.hasActiveSubscription &&
                !access?.isFreeOrTrial
            );
            const platformBrandingEnabled = access?.features?.platformBranding !== false;

            return {
                id: event.id,
                name: event.name,
                status: event.status,
                eventPin,
                joinUrl,
                joinHost,
                qrCodeUrl,
                participantCount: participantCount,
                whiteLabel: whiteLabelEnabled,
                platformBranding: platformBrandingEnabled,
                anonymousMode: Boolean((event as any)?.settings?.qanda?.anonymousMode),
                qandaStopped: Boolean((event as any)?.settings?.qanda?.stopped),
                theme: publicTheme,
                featuredQuestion,
                liveQrExpanded: Boolean((event as any)?.settings?.qanda?.liveQrExpanded),
                liveQrCommandAt: ((event as any)?.settings?.qanda?.liveQrCommandAt as string | undefined) || null,
                screenMode: ((event as any)?.settings?.qanda?.screenMode as string | undefined) || 'wall',
            };
        }),

    list: protectedProcedure.query(async ({ ctx }) => {
        return ctx.prisma.events.findMany({
            where: {
                organization_id: ctx.user.organizationId
            },
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { participants: true } } }
        });
    }),

    create: protectedProcedure
        .input(z.object({
            title: z.string(),
            type: z.string(),
            date: z.string(),
            // Optional pre-generated fields
            eventPin: z.string().optional(),
            joinUrl: z.string().optional(),
            qrCodeUrl: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!hasFullAccess(ctx.user)) {
                const access = await getOrganizationAccess(ctx.prisma as any, ctx.user.organizationId);
                if (access.isExpired) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `Deneme süreniz doldu (bitiş: ${access.trialEndsAt.toLocaleDateString('tr-TR')}). Devam etmek için lütfen paket satın alın.`,
                    });
                }
                // Plan-based event limit
                if (access.features.maxEvents !== null) {
                    const eventCount = await ctx.prisma.events.count({
                        where: { organization_id: ctx.user.organizationId },
                    });
                    if (eventCount >= access.features.maxEvents) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: `Paketinizde en fazla ${access.features.maxEvents} etkinlik oluşturabilirsiniz. Daha fazla etkinlik için paketinizi yükseltin.`,
                        });
                    }
                }
            }

            // Use provided PIN or generate unique 6-digit PIN
            let eventPin = input.eventPin;
            let joinUrl = input.joinUrl;
            let qrCodeUrl = input.qrCodeUrl;

            if (!eventPin) {
                eventPin = Math.floor(100000 + Math.random() * 900000).toString();
                // Ensure uniqueness (simple check)
                const existing = await ctx.prisma.events.findFirst({ where: { event_pin: eventPin } });
                if (existing) {
                    eventPin = Math.floor(100000 + Math.random() * 900000).toString();
                }
            }

            const baseUrl = await getOrganizationJoinBaseUrl(
                ctx.prisma as any,
                ctx.user.organizationId,
                ctx.req as any
            );
            if (!joinUrl) {
                joinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
            }

            joinUrl = normalizeJoinUrl(joinUrl, baseUrl);
            if (!qrCodeUrl || shouldRegenerateQr(qrCodeUrl)) {
                qrCodeUrl = await generateQrDataUrl(joinUrl);
            }

            return ctx.prisma.events.create({
                data: {
                    id: crypto.randomUUID(),
                    name: input.title,
                    slug: input.title.toLowerCase().replace(/ /g, '-'),
                    status: 'draft',
                    organization_id: ctx.user.organizationId,
                    event_pin: eventPin,
                    pin: eventPin,
                    join_url: joinUrl,
                    qr_code_url: qrCodeUrl,
                    event_type: input.type,
                    updated_at: new Date(),
                }
            });
        }),

    getById: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const event = await ctx.prisma.events.findFirst({
                where: {
                    id: input,
                    organization_id: ctx.user.organizationId
                },
                include: {
                    activities: {
                        orderBy: { order_index: 'asc' },
                        include: { questions: { orderBy: { order_index: 'asc' } } }
                    }
                }
            });

            if (!event) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Event not found or access denied" });
            }

            const baseUrl = await getOrganizationJoinBaseUrl(
                ctx.prisma as any,
                ctx.user.organizationId,
                ctx.req as any
            );

            let eventPin = (event as any).event_pin || (event as any).pin || "";
            if (!eventPin) {
                eventPin = await generateUniqueEventPin(ctx.prisma);
                try {
                    await ctx.prisma.events.update({
                        where: { id: (event as any).id },
                        data: {
                            event_pin: eventPin,
                            pin: eventPin,
                            updated_at: new Date(),
                        },
                    });
                } catch {
                    // ignore
                }
            }
            const fallbackJoinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
            const joinUrl = normalizeJoinUrl((event as any).join_url || fallbackJoinUrl, baseUrl);
            const qrCodeUrl = shouldRegenerateQr((event as any).qr_code_url)
                ? await generateQrDataUrl(joinUrl)
                : (event as any).qr_code_url;

            if ((event as any).join_url !== joinUrl || (event as any).qr_code_url !== qrCodeUrl) {
                try {
                    await ctx.prisma.events.update({
                        where: { id: (event as any).id },
                        data: { join_url: joinUrl, qr_code_url: qrCodeUrl, updated_at: new Date() },
                    });
                } catch {
                    // ignore
                }
            }

            return { ...(event as any), eventPin, joinUrl, qrCodeUrl };
        }),

    addActivity: protectedProcedure
        .input(z.object({
            eventId: z.string(),
            type: z.string(),
            name: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify ownership
            const event = await ctx.prisma.events.count({
                where: { id: input.eventId, organization_id: ctx.user.organizationId }
            });
            if (!event) throw new TRPCError({ code: "FORBIDDEN" });

            const count = await ctx.prisma.activities.count({ where: { event_id: input.eventId } });
            return ctx.prisma.activities.create({
                data: {
                    id: crypto.randomUUID(),
                    event_id: input.eventId,
                    type: input.type,
                    name: input.name,
                    order_index: count,
                    status: 'pending'
                }
            });
        }),

    addQuestion: protectedProcedure
        .input(z.object({
            activityId: z.string(),
            text: z.string(),
            type: z.string().default('multiple_choice'),
            options: z.any().optional(),
            correctAnswer: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check ownership via Activity -> Event
            const activity = await ctx.prisma.activities.findUnique({
                where: { id: input.activityId },
                include: { events: true }
            });

            if (!activity || (activity as any).events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            const count = await ctx.prisma.questions.count({ where: { activity_id: input.activityId } });
            return ctx.prisma.questions.create({
                data: {
                    id: crypto.randomUUID(),
                    activity_id: input.activityId,
                    text: input.text,
                    type: input.type,
                    options: input.options || [],
                    correct_answer: input.correctAnswer,
                    order_index: count,
                }
            });
        }),

    updateQuestion: protectedProcedure
        .input(z.object({
            id: z.string(),
            text: z.string().optional(),
            options: z.any().optional(),
            correctAnswer: z.any().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify ownership via Question -> Activity -> Event
            const question = await ctx.prisma.questions.findUnique({
                where: { id: input.id },
                include: { activities: { include: { events: true } } }
            });

            if (!question || (question as any).activities.events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            const data: any = {};
            if (input.text !== undefined) data.text = input.text;
            if (input.options !== undefined) data.options = input.options;
            if (input.correctAnswer !== undefined) data.correct_answer = input.correctAnswer;

            return ctx.prisma.questions.update({
                where: { id: input.id },
                data,
            });
        }),

    deleteQuestion: protectedProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const question = await ctx.prisma.questions.findUnique({
                where: { id: input },
                include: { activities: { include: { events: true } } }
            });

            if (!question || (question as any).activities.events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }

            return ctx.prisma.questions.delete({
                where: { id: input }
            });
        }),

    // Get participants for an event
    getParticipants: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            // Verify ownership
            const event = await ctx.prisma.events.findFirst({
                where: {
                    id: input,
                    organization_id: ctx.user.organizationId
                }
            });

            if (!event) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Event not found or access denied" });
            }

            const activeThreshold = new Date(Date.now() - 45 * 60 * 1000);
            const participants = await ctx.prisma.participants.findMany({
                where: {
                    event_id: input,
                    left_at: null,
                    last_seen_at: { gte: activeThreshold }
                },
                orderBy: { joined_at: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    joined_at: true,
                    last_seen_at: true,
                    metadata: true,
                }
            });

            return participants.map((p: any) => ({
                id: p.id,
                name: p.name,
                email: p.email,
                joinedAt: p.joined_at,
                lastSeenAt: p.last_seen_at,
                metadata: p.metadata,
            }));
        }),

    kickParticipant: protectedProcedure
        .input(
            z.object({
                eventId: z.string(),
                participantId: z.string(),
                reason: z.string().max(200).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const event = await ctx.prisma.events.findFirst({
                where: {
                    id: input.eventId,
                    organization_id: ctx.user.organizationId,
                },
                select: { id: true },
            });

            if (!event) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Event not found or access denied' });
            }

            const participant = await ctx.prisma.participants.findFirst({
                where: { id: input.participantId, event_id: input.eventId },
                select: { id: true, metadata: true },
            });

            if (!participant) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Participant not found' });
            }

            const nowIso = new Date().toISOString();
            const metadata = (participant as any).metadata || {};

            await ctx.prisma.participants.update({
                where: { id: participant.id },
                data: {
                    left_at: new Date(),
                    last_seen_at: new Date(),
                    metadata: {
                        ...(metadata as any),
                        kickedAt: nowIso,
                        kickedBy: ctx.user.id,
                        kickedReason: input.reason || null,
                    },
                } as any,
            });

            return { success: true };
        }),
});
