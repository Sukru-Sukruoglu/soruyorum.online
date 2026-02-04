import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from 'crypto';
import { isSuperAdmin } from "../utils/access";

function normalizeRole(role: unknown): string {
    return (typeof role === 'string' ? role : '').trim().toLowerCase();
}

function hasQandaModerationPermission(user: { role?: string | null; email?: string | null } | null | undefined): boolean {
    if (!user) return false;
    if (isSuperAdmin(user)) return true;
    const role = normalizeRole(user.role);
    return role === 'admin' || role === 'moderator' || role === 'organizer';
}

function requireQandaModerationPermission(user: { role?: string | null; email?: string | null } | null | undefined, action: string): void {
    if (!hasQandaModerationPermission(user)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `You don't have permission to ${action}.`,
        });
    }
}

export const qandaRouter = router({
    // Public: Participants ask questions
    submitQuestion: publicProcedure
        .input(z.object({
            eventId: z.string(),
            participantId: z.string().optional(),
            participantName: z.string().optional().default("Anonim"),
            questionText: z.string().min(1).max(500),
        }))
        .mutation(async ({ ctx, input }) => {
            const event = await ctx.prisma.events.findUnique({
                where: { id: input.eventId },
                select: { id: true, status: true, settings: true },
            });

            if (!event) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
            }

            if (Boolean((event as any)?.settings?.qanda?.stopped)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'QANDA_STOPPED' });
            }

            const created = await ctx.prisma.qanda_submissions.create({
                data: {
                    id: crypto.randomUUID(),
                    event_id: input.eventId,
                    participant_id: input.participantId,
                    participant_name: input.participantName,
                    question_text: input.questionText,
                    status: 'pending',
                    updated_at: new Date()
                }
            });

            // If questions are coming in, the event has effectively started.
            // Best-effort: promote draft -> active (do not fail the submission if this update fails).
            try {
                await ctx.prisma.events.updateMany({
                    where: { id: input.eventId, status: 'draft' },
                    data: { status: 'active', updated_at: new Date() },
                });
            } catch {
                // ignore
            }

            return created;
        }),

    // Protected: Host (Admin) lists questions for their event
    getQuestions: protectedProcedure
        .input(z.object({
            eventId: z.string(),
            status: z.enum(['pending', 'approved', 'rejected']).optional(),
        }))
        .query(async ({ ctx, input }) => {
            // Security: Verify Event belongs to Organization
            const event = await ctx.prisma.events.findFirst({
                where: { id: input.eventId, organization_id: ctx.user.organizationId }
            });
            if (!event) throw new TRPCError({ code: "FORBIDDEN", message: "Event access denied" });

            const questions = await ctx.prisma.qanda_submissions.findMany({
                where: {
                    event_id: input.eventId,
                    status: input.status,
                },
                orderBy: { created_at: 'desc' },
                include: { participants: true }
            });

            return questions.map((q: any) => ({
                id: q.id,
                eventId: q.event_id,
                participantId: q.participant_id,
                participantName: q.participant_name,
                questionText: q.question_text,
                status: q.status,
                isAnswered: q.is_answered,
                createdAt: q.created_at,
                updatedAt: q.updated_at,
                participant: q.participants
            }));
        }),

    // Public: Participants see APPROVED questions only
    getPublicQuestions: publicProcedure
        .input(z.object({
            eventId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const questions = await ctx.prisma.qanda_submissions.findMany({
                where: {
                    event_id: input.eventId,
                    status: 'approved',
                },
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    participant_name: true,
                    question_text: true,
                    is_answered: true,
                    created_at: true,
                    participants: {
                        select: {
                            metadata: true
                        }
                    }
                }
            });

            return questions.map((q: any) => {
                const metadata = q.participants?.metadata as any;
                return {
                    id: q.id,
                    participantName: q.participant_name,
                    questionText: q.question_text,
                    isAnswered: q.is_answered,
                    createdAt: q.created_at,
                    participantAvatar: metadata?.avatar || null
                };
            });
        }),

    // Protected: Host Moderation (Admin/Moderator permission check)
    updateStatus: protectedProcedure
        .input(z.object({
            id: z.string(),
            status: z.enum(['pending', 'approved', 'rejected']),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check ownership via Submission -> Event
            const submission = await ctx.prisma.qanda_submissions.findUnique({
                where: { id: input.id },
                include: { events: true }
            });

            if (!submission || submission.events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "QANDA_EVENT_ACCESS_DENIED" });
            }

            requireQandaModerationPermission(ctx.user, 'moderate questions');

            return ctx.prisma.qanda_submissions.update({
                where: { id: input.id },
                data: { status: input.status, updated_at: new Date() }
            });
        }),

    // Protected: Host marks as answered (Admin/Moderator permission check)
    markAsAnswered: protectedProcedure
        .input(z.object({
            id: z.string(),
            isAnswered: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check ownership
            const submission = await ctx.prisma.qanda_submissions.findUnique({
                where: { id: input.id },
                include: { events: true }
            });

            if (!submission || submission.events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "QANDA_EVENT_ACCESS_DENIED" });
            }

            requireQandaModerationPermission(ctx.user, 'mark questions as answered');

            return ctx.prisma.qanda_submissions.update({
                where: { id: input.id },
                data: { is_answered: input.isAnswered, updated_at: new Date() }
            });
        }),

    // Protected: Host deletes a question (Admin/Moderator permission check)
    deleteQuestion: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check ownership
            const submission = await ctx.prisma.qanda_submissions.findUnique({
                where: { id: input.id },
                include: { events: true }
            });

            if (!submission || submission.events.organization_id !== ctx.user.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "QANDA_EVENT_ACCESS_DENIED" });
            }

            requireQandaModerationPermission(ctx.user, 'delete questions');

            return ctx.prisma.qanda_submissions.delete({
                where: { id: input.id }
            });
        }),

    // Protected: Host selects a question to be featured on the big screen (Admin/Moderator permission check)
    setFeaturedQuestion: protectedProcedure
        .input(z.object({
            eventId: z.string(),
            questionId: z.string().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            const event = await ctx.prisma.events.findFirst({
                where: { id: input.eventId, organization_id: ctx.user.organizationId },
                select: { id: true, settings: true },
            });

            if (!event) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Event access denied' });
            }

            requireQandaModerationPermission(ctx.user, 'set featured question');

            if (input.questionId) {
                const question = await ctx.prisma.qanda_submissions.findFirst({
                    where: { id: input.questionId, event_id: input.eventId },
                    select: { id: true },
                });

                if (!question) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' });
                }
            }

            const settings: any = (event as any).settings || {};
            const qanda: any = settings.qanda || {};

            const nextQanda = {
                ...qanda,
                featuredQuestionId: input.questionId,
                featuredQuestionSetAt: input.questionId ? new Date().toISOString() : null,
            };

            const nextSettings = {
                ...settings,
                qanda: nextQanda,
            };

            await ctx.prisma.events.update({
                where: { id: input.eventId },
                data: { settings: nextSettings, updated_at: new Date() },
            });

            return { ok: true, featuredQuestionId: input.questionId };
        }),
});
