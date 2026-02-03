"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const access_1 = require("../utils/access");
const stripTrailingSlashes = (url) => url.replace(/\/+$/, "");
const getPreferredJoinBaseUrl = (req) => {
    const hostRaw = (req?.headers?.["x-forwarded-host"] ?? req?.headers?.host ?? "").toString().toLowerCase();
    if (hostRaw.includes("soruyorum.online")) {
        return "https://mobil.soruyorum.online";
    }
    const env = (process.env.FRONTEND_URL || "").trim();
    if (env)
        return stripTrailingSlashes(env);
    return "https://mobil.ksinteraktif.com";
};
const normalizeJoinUrl = (joinUrl, baseUrl) => {
    // Prevent accidentally emitting localhost links into QR codes in production.
    const base = stripTrailingSlashes(baseUrl);
    const replacedLocalhost = joinUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, base);
    // For soruyorum.online brand, keep join URLs on that host.
    try {
        const u = new URL(replacedLocalhost);
        const b = new URL(base);
        if (b.hostname.includes("soruyorum.online") && u.hostname !== b.hostname) {
            u.protocol = b.protocol;
            u.host = b.host;
            return u.toString();
        }
    }
    catch {
        // ignore
    }
    return replacedLocalhost;
};
const shouldRegenerateQr = (qrCodeUrl) => {
    if (!qrCodeUrl)
        return true;
    if (qrCodeUrl.startsWith("data:image/"))
        return false;
    // Historical external dependency; regenerate so QR always works.
    if (qrCodeUrl.includes("api.qrserver.com"))
        return true;
    return true;
};
const generateQrDataUrl = async (joinUrl) => {
    return qrcode_1.default.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
    });
};
const generateUniqueEventPin = async (prisma) => {
    // 6-digit numeric PIN; retry until unique (events.event_pin has a unique index)
    for (let attempt = 0; attempt < 25; attempt++) {
        const candidate = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await prisma.events.findFirst({ where: { event_pin: candidate } });
        if (!existing)
            return candidate;
    }
    // Fallback: very unlikely to hit
    return crypto_1.default.randomUUID().replace(/-/g, '').slice(0, 6);
};
exports.eventsRouter = (0, trpc_1.router)({
    // Public endpoint to get event info (PIN, QR) for live display
    getPublicInfo: trpc_1.publicProcedure
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        const baseUrl = getPreferredJoinBaseUrl(ctx.req);
        const event = await ctx.prisma.events.findUnique({
            where: { id: input.id },
            select: {
                id: true,
                name: true,
                pin: true,
                event_pin: true,
                join_url: true,
                qr_code_url: true,
                status: true,
                settings: true,
                _count: {
                    select: { participants: true }
                }
            }
        });
        if (!event) {
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
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
            }
            catch {
                // ignore
            }
        }
        const fallbackJoinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
        const joinUrl = normalizeJoinUrl(event.join_url || fallbackJoinUrl, baseUrl);
        const qrCodeUrl = shouldRegenerateQr(event.qr_code_url)
            ? await generateQrDataUrl(joinUrl)
            : event.qr_code_url;
        const featuredQuestionId = event?.settings?.qanda?.featuredQuestionId;
        let featuredQuestion = null;
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
            }
            else {
                // Best-effort cleanup if the referenced question no longer exists.
                try {
                    const settings = event.settings || {};
                    const qanda = settings.qanda || {};
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
                }
                catch {
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
            }
            catch {
                // ignore
            }
        }
        return {
            id: event.id,
            name: event.name,
            status: event.status,
            eventPin,
            joinUrl,
            qrCodeUrl,
            participantCount: event._count.participants,
            anonymousMode: Boolean(event?.settings?.qanda?.anonymousMode),
            qandaStopped: Boolean(event?.settings?.qanda?.stopped),
            theme: event?.settings?.theme ?? null,
            featuredQuestion,
            screenMode: event?.settings?.qanda?.screenMode || 'wall',
        };
    }),
    list: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        return ctx.prisma.events.findMany({
            where: {
                organization_id: ctx.user.organizationId
            },
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { participants: true } } }
        });
    }),
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string(),
        type: zod_1.z.string(),
        date: zod_1.z.string(),
        // Optional pre-generated fields
        eventPin: zod_1.z.string().optional(),
        joinUrl: zod_1.z.string().optional(),
        qrCodeUrl: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!(0, access_1.isSuperAdmin)(ctx.user)) {
            const access = await (0, access_1.getOrganizationAccess)(ctx.prisma, ctx.user.organizationId);
            if (access.isExpired) {
                throw new server_1.TRPCError({
                    code: "FORBIDDEN",
                    message: `Deneme süreniz doldu (bitiş: ${access.trialEndsAt.toLocaleDateString('tr-TR')}). Devam etmek için lütfen paket satın alın.`,
                });
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
        const baseUrl = getPreferredJoinBaseUrl(ctx.req);
        if (!joinUrl) {
            joinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
        }
        joinUrl = normalizeJoinUrl(joinUrl, baseUrl);
        if (!qrCodeUrl || shouldRegenerateQr(qrCodeUrl)) {
            qrCodeUrl = await generateQrDataUrl(joinUrl);
        }
        return ctx.prisma.events.create({
            data: {
                id: crypto_1.default.randomUUID(),
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
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.string())
        .query(async ({ ctx, input }) => {
        const baseUrl = getPreferredJoinBaseUrl(ctx.req);
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
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Event not found or access denied" });
        }
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
            }
            catch {
                // ignore
            }
        }
        const fallbackJoinUrl = `${stripTrailingSlashes(baseUrl)}/join?pin=${eventPin}`;
        const joinUrl = normalizeJoinUrl(event.join_url || fallbackJoinUrl, baseUrl);
        const qrCodeUrl = shouldRegenerateQr(event.qr_code_url)
            ? await generateQrDataUrl(joinUrl)
            : event.qr_code_url;
        if (event.join_url !== joinUrl || event.qr_code_url !== qrCodeUrl) {
            try {
                await ctx.prisma.events.update({
                    where: { id: event.id },
                    data: { join_url: joinUrl, qr_code_url: qrCodeUrl, updated_at: new Date() },
                });
            }
            catch {
                // ignore
            }
        }
        return { ...event, eventPin, joinUrl, qrCodeUrl };
    }),
    addActivity: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        eventId: zod_1.z.string(),
        type: zod_1.z.string(),
        name: zod_1.z.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const event = await ctx.prisma.events.count({
            where: { id: input.eventId, organization_id: ctx.user.organizationId }
        });
        if (!event)
            throw new server_1.TRPCError({ code: "FORBIDDEN" });
        const count = await ctx.prisma.activities.count({ where: { event_id: input.eventId } });
        return ctx.prisma.activities.create({
            data: {
                id: crypto_1.default.randomUUID(),
                event_id: input.eventId,
                type: input.type,
                name: input.name,
                order_index: count,
                status: 'pending'
            }
        });
    }),
    addQuestion: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        activityId: zod_1.z.string(),
        text: zod_1.z.string(),
        type: zod_1.z.string().default('multiple_choice'),
        options: zod_1.z.any().optional(),
        correctAnswer: zod_1.z.any().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        // Check ownership via Activity -> Event
        const activity = await ctx.prisma.activities.findUnique({
            where: { id: input.activityId },
            include: { events: true }
        });
        if (!activity || activity.events.organization_id !== ctx.user.organizationId) {
            throw new server_1.TRPCError({ code: "FORBIDDEN" });
        }
        const count = await ctx.prisma.questions.count({ where: { activity_id: input.activityId } });
        return ctx.prisma.questions.create({
            data: {
                id: crypto_1.default.randomUUID(),
                activity_id: input.activityId,
                text: input.text,
                type: input.type,
                options: input.options || [],
                correct_answer: input.correctAnswer,
                order_index: count,
            }
        });
    }),
    updateQuestion: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        text: zod_1.z.string().optional(),
        options: zod_1.z.any().optional(),
        correctAnswer: zod_1.z.any().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        // Verify ownership via Question -> Activity -> Event
        const question = await ctx.prisma.questions.findUnique({
            where: { id: input.id },
            include: { activities: { include: { events: true } } }
        });
        if (!question || question.activities.events.organization_id !== ctx.user.organizationId) {
            throw new server_1.TRPCError({ code: "FORBIDDEN" });
        }
        const data = {};
        if (input.text !== undefined)
            data.text = input.text;
        if (input.options !== undefined)
            data.options = input.options;
        if (input.correctAnswer !== undefined)
            data.correct_answer = input.correctAnswer;
        return ctx.prisma.questions.update({
            where: { id: input.id },
            data,
        });
    }),
    deleteQuestion: trpc_1.protectedProcedure
        .input(zod_1.z.string())
        .mutation(async ({ ctx, input }) => {
        const question = await ctx.prisma.questions.findUnique({
            where: { id: input },
            include: { activities: { include: { events: true } } }
        });
        if (!question || question.activities.events.organization_id !== ctx.user.organizationId) {
            throw new server_1.TRPCError({ code: "FORBIDDEN" });
        }
        return ctx.prisma.questions.delete({
            where: { id: input }
        });
    }),
    // Get participants for an event
    getParticipants: trpc_1.protectedProcedure
        .input(zod_1.z.string())
        .query(async ({ ctx, input }) => {
        // Verify ownership
        const event = await ctx.prisma.events.findFirst({
            where: {
                id: input,
                organization_id: ctx.user.organizationId
            }
        });
        if (!event) {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Event not found or access denied" });
        }
        const participants = await ctx.prisma.participants.findMany({
            where: { event_id: input },
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
        return participants.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            joinedAt: p.joined_at,
            lastSeenAt: p.last_seen_at,
            metadata: p.metadata,
        }));
    }),
    kickParticipant: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        eventId: zod_1.z.string(),
        participantId: zod_1.z.string(),
        reason: zod_1.z.string().max(200).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const event = await ctx.prisma.events.findFirst({
            where: {
                id: input.eventId,
                organization_id: ctx.user.organizationId,
            },
            select: { id: true },
        });
        if (!event) {
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Event not found or access denied' });
        }
        const participant = await ctx.prisma.participants.findFirst({
            where: { id: input.participantId, event_id: input.eventId },
            select: { id: true, metadata: true },
        });
        if (!participant) {
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Participant not found' });
        }
        const nowIso = new Date().toISOString();
        const metadata = participant.metadata || {};
        await ctx.prisma.participants.update({
            where: { id: participant.id },
            data: {
                left_at: new Date(),
                last_seen_at: new Date(),
                metadata: {
                    ...metadata,
                    kickedAt: nowIso,
                    kickedBy: ctx.user.id,
                    kickedReason: input.reason || null,
                },
            },
        });
        return { success: true };
    }),
});
